<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\WorkLocation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Get attendance history
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $perPage = $request->input('per_page', 20);
            
            // Get attendance records for current user or all if admin
            $query = Attendance::with('user');

            if ($user->role !== 'administrator') {
                $query->where('user_id', $user->id);
            }

            if ($request->date) {
                $query->whereDate('date', $request->date);
            }

            $attendances = $query->orderBy('date', 'desc')
                ->orderBy('check_in_time', 'desc')
                ->paginate($perPage);
            
            $formattedData = $attendances->getCollection()->map(function($attendance) {
                return [
                    'id' => $attendance->id,
                    'user_id' => $attendance->user_id,
                    'user_name' => $attendance->user->name ?? 'Unknown',
                    'user_role' => $attendance->user->role ?? null,
                    'date' => $attendance->date ? $attendance->date->format('Y-m-d') : null,
                    'check_in_time' => $attendance->check_in_time ? $attendance->check_in_time->toISOString() : null,
                    'check_out_time' => $attendance->check_out_time ? $attendance->check_out_time->toISOString() : null,
                    'check_in_latitude' => $attendance->check_in_latitude,
                    'check_in_longitude' => $attendance->check_in_longitude,
                    'check_out_latitude' => $attendance->check_out_latitude,
                    'check_out_longitude' => $attendance->check_out_longitude,
                    'check_in_photo' => $attendance->check_in_photo ? asset('storage/' . $attendance->check_in_photo) : null,
                    'check_out_photo' => $attendance->check_out_photo ? asset('storage/' . $attendance->check_out_photo) : null,
                    'gps_warning' => $attendance->gps_warning ?? false,
                    'distance_from_office' => $attendance->distance_from_office,
                    'status' => $attendance->status ?? 'present',
                    'working_hours' => $attendance->work_duration ? round($attendance->work_duration / 60, 2) : null,
                    'is_late' => $attendance->is_late,
                    'created_at' => $attendance->created_at ? $attendance->created_at->toISOString() : null,
                    'updated_at' => $attendance->updated_at ? $attendance->updated_at->toISOString() : null
                ];
            });
            
            $summary = null;
            if ($user->role === 'administrator' && $request->date) {
                $totalActive   = User::where('is_active', true)->count();
                $presentCount  = Attendance::whereDate('date', $request->date)->count();
                $lateCount     = Attendance::whereDate('date', $request->date)->where('is_late', true)->count();
                $summary = [
                    'totalEmployees' => $totalActive,
                    'presentToday'   => $presentCount,
                    'absentToday'    => max(0, $totalActive - $presentCount),
                    'lateToday'      => $lateCount,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedData,
                'summary' => $summary,
                'pagination' => [
                    'current_page' => $attendances->currentPage(),
                    'last_page' => $attendances->lastPage(),
                    'per_page' => $attendances->perPage(),
                    'total' => $attendances->total()
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Attendance index error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load attendance data: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Check in attendance with GPS and camera validation
     */
    public function checkIn(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $today = Carbon::today();
            
            // Validate request - ALLOW NULL GPS for "no GPS" check-ins
            $request->validate([
                'latitude' => 'nullable|numeric|between:-90,90', // Allow null for no GPS
                'longitude' => 'nullable|numeric|between:-180,180',
                'photo' => 'nullable|string', // Base64 encoded photo
                'gps_data' => 'nullable|array',
                'device_info' => 'nullable|array',
                'status' => 'nullable|string', // Allow frontend to specify status
                'gps_warning' => 'nullable|boolean' // Allow frontend to specify GPS warning
            ]);
            
            // Check if already checked in today
            $existingAttendance = Attendance::where('user_id', $user->id)
                ->whereDate('date', $today)
                ->whereNotNull('check_in_time')
                ->first();
                
            if ($existingAttendance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sudah melakukan check-in hari ini'
                ], 400);
            }
            
            $latitude = $request->latitude ? (float) $request->latitude : null;
            $longitude = $request->longitude ? (float) $request->longitude : null;
            
            // Initialize GPS warning and distance
            $distanceFromOffice = null;
            $gpsWarning = $request->gps_warning ?? false; // Use frontend value if provided
            
            // Only calculate distance if GPS coordinates are available
            if ($latitude && $longitude) {
                // Get nearest work location and calculate distance
                $workLocation = WorkLocation::active()->first();
                
                if ($workLocation) {
                    $distanceFromOffice = $workLocation->calculateDistance($latitude, $longitude);
                    
                    // Check if outside work area (200m radius) - but don't block
                    if ($distanceFromOffice > $workLocation->radius_meters) {
                        $gpsWarning = true;
                    }
                }
                
                // Detect GPS spoofing - but don't block
                if ($this->detectGpsSpoofing($request->gps_data)) {
                    $gpsWarning = true;
                }
            } else {
                // No GPS available
                $gpsWarning = true;
            }
            
            // Handle photo upload - save as file using existing method
            $photoPath = null;
            if ($request->has('photo') && $request->photo) {
                $photoPath = $this->saveAttendancePhoto($request->photo, $user->id, 'checkin');
            }
            
            // Determine status - use frontend status if provided, otherwise calculate
            $checkInTime = Carbon::now();
            $status = $request->status ?? 'present';
            
            if (!$request->status) {
                // Calculate status if not provided by frontend
                if (!$latitude || !$longitude) {
                    $status = 'no_gps';
                } else if ($gpsWarning) {
                    if ($distanceFromOffice && $distanceFromOffice > 200) {
                        $status = 'outside_area';
                    } else {
                        $status = 'gps_warning';
                    }
                } else if ($checkInTime->format('H:i') > '08:00') {
                    $status = 'late';
                }
            }
            
            // Create attendance record - ALWAYS ALLOW
            $attendance = Attendance::create([
                'user_id' => $user->id,
                'date' => $today,
                'check_in_time' => $checkInTime,
                'check_in_latitude' => $latitude,
                'check_in_longitude' => $longitude,
                'check_in_photo' => $photoPath, // Save file path to DB
                'gps_warning' => $gpsWarning,
                'distance_from_office' => $distanceFromOffice,
                'gps_data' => $request->gps_data,
                'device_info' => $request->device_info,
                'status' => $status
            ]);
            
            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'attendance_check_in',
                'description' => "Check-in at " . $checkInTime->format('H:i:s') . 
                    ($gpsWarning ? ' (GPS Warning)' : '') . " - Status: $status",
                'ip_address' => $request->ip()
            ]);
            
            // Build success message
            $message = 'Check-in berhasil';
            if ($status === 'no_gps') {
                $message .= ' tanpa GPS';
            } else if ($status === 'outside_area') {
                $message .= ". Peringatan: Anda berada " . round($distanceFromOffice) . "m dari lokasi kerja";
            } else if ($status === 'gps_warning') {
                $message .= ". Peringatan: GPS terdeteksi tidak normal";
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'id' => $attendance->id,
                    'check_in_time' => $attendance->check_in_time->toISOString(),
                    'check_in_photo' => $attendance->check_in_photo ? asset('storage/' . $attendance->check_in_photo) : null,
                    'gps_warning' => $attendance->gps_warning,
                    'distance_from_office' => $attendance->distance_from_office,
                    'status' => $attendance->status
                ]
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal check-in: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check out attendance with GPS validation
     */
    public function checkOut(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $today = Carbon::today();
            
            // Validate request
            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'photo' => 'nullable|string', // Base64 encoded photo
                'gps_data' => 'nullable|array',
                'device_info' => 'nullable|array'
            ]);
            
            // Find today's attendance record
            $attendance = Attendance::where('user_id', $user->id)
                ->whereDate('date', $today)
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->first();
                
            if (!$attendance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Belum melakukan check-in hari ini atau sudah check-out'
                ], 400);
            }
            
            $latitude = (float) $request->latitude;
            $longitude = (float) $request->longitude;
            
            // Calculate distance from office for check-out
            $workLocation = WorkLocation::active()->first();
            $checkoutDistanceFromOffice = null;
            $checkoutGpsWarning = false;
            
            if ($workLocation) {
                $checkoutDistanceFromOffice = $workLocation->calculateDistance($latitude, $longitude);
                
                // Check if outside work area
                if ($checkoutDistanceFromOffice > $workLocation->radius_meters) {
                    $checkoutGpsWarning = true;
                }
            }
            
            // Detect GPS spoofing for checkout
            if ($this->detectGpsSpoofing($request->gps_data)) {
                $checkoutGpsWarning = true;
            }
            
            // Handle photo upload - save as file using existing method (consistent with check-in)
            $photoPath = null;
            if ($request->has('photo') && $request->photo) {
                $photoPath = $this->saveAttendancePhoto($request->photo, $user->id, 'checkout');
            }
            
            $checkOutTime = Carbon::now();
            
            // Update attendance record
            $attendance->update([
                'check_out_time' => $checkOutTime,
                'check_out_latitude' => $latitude,
                'check_out_longitude' => $longitude,
                'check_out_photo' => $photoPath, // Save file path to DB (consistent with check-in)
                'gps_warning' => $attendance->gps_warning || $checkoutGpsWarning, // Keep existing or add new warning
                'gps_data' => array_merge($attendance->gps_data ?? [], ['checkout' => $request->gps_data]),
                'device_info' => array_merge($attendance->device_info ?? [], ['checkout' => $request->device_info])
            ]);
            
            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'attendance_check_out',
                'description' => "Check-out at " . $checkOutTime->format('H:i:s') . 
                    ($checkoutGpsWarning ? ' (GPS Warning)' : ''),
                'ip_address' => $request->ip()
            ]);
            
            $message = 'Check-out berhasil';
            if ($checkoutGpsWarning) {
                if ($checkoutDistanceFromOffice && $checkoutDistanceFromOffice > 200) {
                    $message .= ". Peringatan: Anda berada " . round($checkoutDistanceFromOffice) . "m dari lokasi kerja";
                } else {
                    $message .= ". Peringatan: GPS terdeteksi tidak normal";
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'id' => $attendance->id,
                    'check_out_time' => $attendance->check_out_time->toISOString(),
                    'check_out_photo' => $attendance->check_out_photo ? asset('storage/' . $attendance->check_out_photo) : null,
                    'working_hours' => $attendance->work_duration ? round($attendance->work_duration / 60, 2) : null,
                    'gps_warning' => $attendance->gps_warning
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal check-out: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's attendance for current user
     */
    public function getTodayAttendance(): JsonResponse
    {
        try {
            $user = auth()->user();
            $today = Carbon::today();
            
            $attendance = Attendance::where('user_id', $user->id)
                ->whereDate('date', $today)
                ->first();
            
            if (!$attendance) {
                return response()->json([
                    'success' => true,
                    'data' => null
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $attendance->id,
                    'date' => $attendance->date->format('Y-m-d'),
                    'check_in_time' => $attendance->check_in_time ? $attendance->check_in_time->toISOString() : null,
                    'check_out_time' => $attendance->check_out_time ? $attendance->check_out_time->toISOString() : null,
                    'check_in_latitude' => $attendance->check_in_latitude,
                    'check_in_longitude' => $attendance->check_in_longitude,
                    'check_out_latitude' => $attendance->check_out_latitude,
                    'check_out_longitude' => $attendance->check_out_longitude,
                    'check_in_photo' => $attendance->check_in_photo ? asset('storage/' . $attendance->check_in_photo) : null,
                    'check_out_photo' => $attendance->check_out_photo ? asset('storage/' . $attendance->check_out_photo) : null,
                    'gps_warning' => $attendance->gps_warning ?? false,
                    'distance_from_office' => $attendance->distance_from_office,
                    'status' => $attendance->status ?? 'present',
                    'working_hours' => $attendance->work_duration ? round($attendance->work_duration / 60, 2) : null,
                    'is_late' => $attendance->is_late
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get today attendance: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get attendance summary for admin dashboard
     */
    public function getAttendanceSummary(): JsonResponse
    {
        try {
            $today = Carbon::today();
            
            // Get today's attendance
            $todayAttendances = Attendance::with('user')
                ->whereDate('date', $today)
                ->get();
            
            // Get total active employees
            $totalEmployees = User::where('is_active', true)->count();
            
            // Calculate stats
            $checkedInToday = $todayAttendances->whereNotNull('check_in_time')->count();
            $checkedOutToday = $todayAttendances->whereNotNull('check_out_time')->count();
            $currentlyWorking = $checkedInToday - $checkedOutToday;
            $attendanceRate = $totalEmployees > 0 ? round(($checkedInToday / $totalEmployees) * 100, 2) : 0;
            $lateArrivals = $todayAttendances->filter(function($attendance) {
                return $attendance->is_late;
            })->count();
            $gpsWarnings = $todayAttendances->where('gps_warning', true)->count();
            
            // Get latest attendance activities (last 10)
            $latestActivities = Attendance::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($attendance) {
                    return [
                        'id' => $attendance->id,
                        'user_id' => $attendance->user_id,
                        'user_name' => $attendance->user->name ?? 'Unknown',
                        'date' => $attendance->date->format('Y-m-d'),
                        'check_in_time' => $attendance->check_in_time ? $attendance->check_in_time->format('H:i:s') : null,
                        'check_out_time' => $attendance->check_out_time ? $attendance->check_out_time->format('H:i:s') : null,
                        'gps_warning' => $attendance->gps_warning ?? false,
                        'status' => $attendance->status ?? 'present',
                        'created_at' => $attendance->created_at->toISOString()
                    ];
                });
            
            // Format today's attendance
            $todayAttendanceFormatted = $todayAttendances->map(function($attendance) {
                return [
                    'id' => $attendance->id,
                    'user_id' => $attendance->user_id,
                    'user_name' => $attendance->user->name ?? 'Unknown',
                    'date' => $attendance->date->format('Y-m-d'),
                    'check_in_time' => $attendance->check_in_time ? $attendance->check_in_time->format('H:i:s') : null,
                    'check_out_time' => $attendance->check_out_time ? $attendance->check_out_time->format('H:i:s') : null,
                    'gps_warning' => $attendance->gps_warning ?? false,
                    'distance_from_office' => $attendance->distance_from_office,
                    'status' => $attendance->status ?? 'present',
                    'working_hours' => $attendance->work_duration ? round($attendance->work_duration / 60, 2) : null,
                    'is_late' => $attendance->is_late
                ];
            })->values();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'today_stats' => [
                        'total_employees' => $totalEmployees,
                        'checked_in' => $checkedInToday,
                        'checked_out' => $checkedOutToday,
                        'currently_working' => $currentlyWorking,
                        'attendance_rate' => $attendanceRate,
                        'late_arrivals' => $lateArrivals,
                        'gps_warnings' => $gpsWarnings
                    ],
                    'latest_activities' => $latestActivities,
                    'today_attendance' => $todayAttendanceFormatted
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get attendance summary: ' . $e->getMessage(),
                'data' => [
                    'today_stats' => [
                        'total_employees' => 0,
                        'checked_in' => 0,
                        'checked_out' => 0,
                        'currently_working' => 0,
                        'attendance_rate' => 0,
                        'late_arrivals' => 0,
                        'gps_warnings' => 0
                    ],
                    'latest_activities' => [],
                    'today_attendance' => []
                ]
            ], 500);
        }
    }

    /**
     * Get attendance summary for admin dashboard (alias for getAttendanceSummary)
     */
    public function summary(): JsonResponse
    {
        return $this->getAttendanceSummary();
    }

    /**
     * Delete individual attendance record (Admin/Sales Manager only)
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Only admin and sales_manager can delete attendance
            if (!in_array($user->role, ['administrator', 'sales_manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            $attendance = Attendance::with('user')->find($id);
            
            if (!$attendance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance record not found'
                ], 404);
            }
            
            // Store info for logging before deletion
            $attendanceInfo = [
                'user_name' => $attendance->user->name,
                'date' => $attendance->date,
                'check_in_time' => $attendance->check_in_time,
                'check_out_time' => $attendance->check_out_time
            ];
            
            // Delete the attendance record
            $attendance->delete();
            
            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'attendance_deleted',
                'description' => "Deleted attendance record for {$attendanceInfo['user_name']} on {$attendanceInfo['date']}",
                'ip_address' => request()->ip()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Attendance record berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Attendance delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attendance: ' . $e->getMessage()
            ], 500);
        }
    }


    
    /**
     * Save attendance photo to storage
     */
    private function saveAttendancePhoto($photoBase64, $userId, $type = 'checkin')
    {
        try {
            // Extract base64 image data
            $photoData = $photoBase64;
            if (strpos($photoData, 'data:image') === 0) {
                $photoData = substr($photoData, strpos($photoData, ',') + 1);
            }
            
            // Decode and save photo
            $photoContent = base64_decode($photoData);
            $photoName = 'attendance_' . $userId . '_' . $type . '_' . time() . '.jpg';
            $photoPath = 'attendance_photos/' . $photoName;
            
            Storage::disk('public')->put($photoPath, $photoContent);
            
            return $photoPath;
        } catch (\Exception $e) {
            // Photo upload failed, return null
            error_log('Photo upload failed: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Detect GPS spoofing based on GPS data patterns
     */
    private function detectGpsSpoofing($gpsData)
    {
        if (!$gpsData || !is_array($gpsData)) {
            return false;
        }
        
        $suspiciousFlags = 0;
        
        // 1. Check for mock location provider (CRITICAL)
        if (isset($gpsData['is_mock']) && $gpsData['is_mock'] === true) {
            return true; // Immediate red flag
        }
        
        // 2. Check for suspiciously perfect accuracy (< 3m is unusual for mobile GPS)
        if (isset($gpsData['accuracy']) && $gpsData['accuracy'] < 3) {
            $suspiciousFlags++;
            
            // If perfect accuracy AND no movement, very suspicious
            if (isset($gpsData['speed']) && ($gpsData['speed'] === 0 || $gpsData['speed'] === null)) {
                $suspiciousFlags++;
            }
        }
        
        // 3. Check for impossible accuracy (< 1m is nearly impossible for consumer GPS)
        if (isset($gpsData['accuracy']) && $gpsData['accuracy'] < 1) {
            $suspiciousFlags += 2;
        }
        
        // 4. Check altitude - if exactly 0 or missing, might be spoofed
        if (!isset($gpsData['altitude']) || $gpsData['altitude'] === 0) {
            $suspiciousFlags++;
        }
        
        // 5. Check for missing heading/bearing (real GPS usually provides this)
        if (!isset($gpsData['heading']) && isset($gpsData['speed']) && $gpsData['speed'] > 0) {
            $suspiciousFlags++;
        }
        
        // 6. Check if explicitly marked as spoofing suspected from frontend
        if (isset($gpsData['spoofing_suspected']) && $gpsData['spoofing_suspected'] === true) {
            return true;
        }
        
        // 7. Check for GPS provider - if not 'gps' or 'fused', might be fake
        if (isset($gpsData['provider']) && !in_array(strtolower($gpsData['provider']), ['gps', 'fused', 'network'])) {
            $suspiciousFlags++;
        }
        
        // If 3 or more suspicious flags, likely fake GPS
        return $suspiciousFlags >= 3;
    }
}