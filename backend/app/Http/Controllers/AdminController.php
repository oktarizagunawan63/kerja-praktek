<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Project;
use App\Models\Attendance;
use App\Models\Customer;
use App\Models\PlanVisit;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get admin dashboard statistics (alias for getDashboardStats)
     */
    public function dashboard(Request $request)
    {
        return $this->getDashboardStats($request);
    }

    /**
     * Get admin dashboard statistics
     */
    public function getDashboardStats(Request $request)
    {
        try {
            // Project statistics
            $totalProjects = Project::whereNull('deleted_at')->count();
            $activeProjects = Project::whereNull('deleted_at')
                ->whereNotIn('status', ['completed'])->count();
            $completedProjects = Project::whereNull('deleted_at')
                ->where('status', 'completed')->count();
            $delayedProjects = Project::whereNull('deleted_at')
                ->where('status', 'delayed')->count();

            // RAB statistics
            $totalRab = Project::whereNull('deleted_at')->sum('rab') ?? 0; // Use actual rab column
            $totalRealisasi = Project::whereNull('deleted_at')->sum('rab_realisasi') ?? 0; // Use actual rab_realisasi column
            $rabPercentage = $totalRab > 0 ? round(($totalRealisasi / $totalRab) * 100, 2) : 0;

            // User statistics
            $totalUsers = User::count();
            $activeUsers = User::where('is_active', true)->count();
            $pendingUsers = User::where('status', 'pending')->count();

            // Attendance statistics (today)
            $today = now()->format('Y-m-d');
            $todayAttendance = Attendance::whereDate('date', $today)->get();
            $checkedInToday = $todayAttendance->whereNotNull('check_in_time')->count();
            $checkedOutToday = $todayAttendance->whereNotNull('check_out_time')->count();
            $currentlyWorking = $checkedInToday - $checkedOutToday;
            $attendanceRate = $activeUsers > 0 ? round(($checkedInToday / $activeUsers) * 100, 2) : 0;

            // Visit statistics
            $totalCustomers = Customer::count();
            $totalVisits = PlanVisit::count();
            $completedVisits = PlanVisit::whereHas('realisasiVisit', function($q) {
                $q->where('status', 'done');
            })->count();

            // Recent projects (created by Site Managers) - optimized with select
            $recentProjects = Project::select('id', 'name', 'status', 'progress', 'rab', 'rab_realisasi', 'project_manager_id', 'created_at')
                ->with(['projectManager:id,name'])
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'status' => $project->status,
                        'progress' => $project->progress ?? 0,
                        'rab' => $project->rab ?? 0,
                        'rab_realisasi' => $project->rab_realisasi ?? 0,
                        'created_by' => $project->projectManager->name ?? 'Unknown',
                        'created_at' => $project->created_at->format('Y-m-d H:i')
                    ];
                });

            // Recent activity logs - optimized with select
            $recentActivities = ActivityLog::select('id', 'action', 'description', 'user_id', 'created_at')
                ->with(['user:id,name'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->action,
                        'description' => $log->description,
                        'user_name' => $log->user->name ?? 'System',
                        'created_at' => $log->created_at->format('Y-m-d H:i:s')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'projects' => [
                        'total' => $totalProjects,
                        'active' => $activeProjects,
                        'completed' => $completedProjects,
                        'delayed' => $delayedProjects
                    ],
                    'rab' => [
                        'total' => $totalRab,
                        'realisasi' => $totalRealisasi,
                        'percentage' => $rabPercentage
                    ],
                    'users' => [
                        'total' => $totalUsers,
                        'active' => $activeUsers,
                        'pending' => $pendingUsers
                    ],
                    'attendance' => [
                        'checked_in_today' => $checkedInToday,
                        'checked_out_today' => $checkedOutToday,
                        'currently_working' => $currentlyWorking,
                        'attendance_rate' => $attendanceRate
                    ],
                    'visits' => [
                        'total_customers' => $totalCustomers,
                        'total_visits' => $totalVisits,
                        'completed_visits' => $completedVisits
                    ],
                    'recent_projects' => $recentProjects,
                    'recent_activities' => $recentActivities
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all users for admin management
     */
    public function getUsers(Request $request)
    {
        try {
            $users = User::with(['approver'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'division' => $user->division ?? null,
                        'is_active' => $user->is_active,
                        'status' => $user->status ?? 'approved',
                        'approved_by' => $user->approver->name ?? null,
                        'approved_at' => $user->approved_at,
                        'created_at' => $user->created_at->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load users: ' . $e->getMessage()
            ], 500);
        }
    }

            // Get attendance monitoring data
    public function getAttendanceMonitor(Request $request)
    {
        try {
            $date = $request->input('date', now()->format('Y-m-d'));
            $search = $request->input('search', '');
            
            // Get total active users count (excluding admin)
            $totalEmployees = User::where('is_active', true)
                ->where('role', '!=', 'admin')
                ->count();
            
            // Build query for attendance with user filtering
            $query = Attendance::select('attendance.*')
                ->with(['user:id,name,role'])
                ->whereDate('date', $date)
                ->whereHas('user', function($q) {
                    $q->where('is_active', true)
                      ->where('role', '!=', 'admin');
                });
            
            // Add search filter if provided
            if ($search) {
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%')
                      ->orWhere('role', 'like', '%' . $search . '%');
                });
            }
            
            // Get attendance for specific date
            $attendances = $query->orderBy('check_in_time', 'desc')
                ->get()
                ->map(function($attendance) {
                    return [
                        'id' => $attendance->id,
                        'user_id' => $attendance->user_id,
                        'user_name' => $attendance->user->name,
                        'user_role' => $attendance->user->role,
                        'date' => $attendance->date->format('Y-m-d'),
                        'check_in_time' => $attendance->check_in_time ? $attendance->check_in_time->toISOString() : null,
                        'check_out_time' => $attendance->check_out_time ? $attendance->check_out_time->toISOString() : null,
                        'check_in_latitude' => $attendance->check_in_latitude,
                        'check_in_longitude' => $attendance->check_in_longitude,
                        'check_out_latitude' => $attendance->check_out_latitude,
                        'check_out_longitude' => $attendance->check_out_longitude,
                        'check_in_photo' => $attendance->check_in_photo ? 
                            (str_starts_with($attendance->check_in_photo, 'data:image') ? 
                                $attendance->check_in_photo : 
                                'attendance_photos/' . basename($attendance->check_in_photo)
                            ) : null,
                        'check_out_photo' => $attendance->check_out_photo ? 
                            (str_starts_with($attendance->check_out_photo, 'data:image') ? 
                                $attendance->check_out_photo : 
                                'attendance_photos/' . basename($attendance->check_out_photo)
                            ) : null,
                        'gps_warning' => $attendance->gps_warning ?? false,
                        'gps_warnings' => $attendance->gps_warnings ? json_decode($attendance->gps_warnings, true) : [],
                        'distance_from_office' => $attendance->distance_from_office,
                        'status' => $attendance->status ?? 'present',
                        'working_hours' => $attendance->work_duration ? round($attendance->work_duration / 60, 2) : null,
                        'is_late' => $attendance->is_late ?? false
                    ];
                });

            // Only add absent users if no search filter
            if (!$search) {
                // Get users who didn't check in
                $attendedUserIds = $attendances->pluck('user_id')->toArray();
                $absentUsers = User::select('id', 'name', 'role')
                    ->where('is_active', true)
                    ->where('role', '!=', 'admin')
                    ->whereNotIn('id', $attendedUserIds)
                    ->get();
                
                foreach ($absentUsers as $user) {
                    $attendances->push([
                        'id' => null,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_role' => $user->role,
                        'date' => $date,
                        'check_in_time' => null,
                        'check_out_time' => null,
                        'check_in_latitude' => null,
                        'check_in_longitude' => null,
                        'check_out_latitude' => null,
                        'check_out_longitude' => null,
                        'check_in_photo' => null,
                        'check_out_photo' => null,
                        'gps_warning' => false,
                        'gps_warnings' => [],
                        'distance_from_office' => null,
                        'status' => 'absent',
                        'working_hours' => null,
                        'is_late' => false
                    ]);
                }
            }

            // Calculate summary stats
            $presentToday = $attendances->whereNotNull('check_in_time')->count();
            $absentToday = $totalEmployees - $presentToday;
            $lateToday = $attendances->where('is_late', true)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'attendance' => $attendances->values(),
                    'summary' => [
                        'totalEmployees' => $totalEmployees,
                        'presentToday' => $presentToday,
                        'absentToday' => $absentToday,
                        'lateToday' => $lateToday
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load attendance monitor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity logs
     */
    public function getActivityLogs(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 50);
            $page = $request->input('page', 1);

            $logs = ActivityLog::with('user')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            $formattedLogs = $logs->getCollection()->map(function($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'user_name' => $log->user->name ?? 'System',
                    'user_role' => $log->user->role ?? null,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s')
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedLogs,
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load activity logs: ' . $e->getMessage()
            ], 500);
        }
    }
}