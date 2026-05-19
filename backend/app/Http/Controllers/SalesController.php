<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PlanVisit;
use App\Models\RealisasiVisit;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SalesController extends Controller
{
    /**
     * Get Sales Dashboard Data
     */
    public function dashboard(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Verify user is sales
            if ($user->role !== 'sales') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            $today = Carbon::today();
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();
            
            // 1. My Customers - count approved customers assigned to this sales
            $myCustomersCount = Customer::where('created_by', $user->id)
                ->where('approval_status', 'approved')
                ->count();
            
            // 2. Assigned Visits - visits that still need action from this sales
            $assignedVisitsCount = PlanVisit::where('assigned_to', $user->id)
                ->whereIn('status', ['pending', 'approved', 'scheduled'])
                ->whereDoesntHave('realisasiVisit')
                ->count();
            
            // 3. Completed Visits This Month - count completed visits via realisasi_visits
            // A visit is completed when it has a realisasi_visit with status 'done'
            $completedVisitsCount = PlanVisit::where('assigned_to', $user->id)
                ->whereHas('realisasiVisit', function($query) {
                    $query->where('status', 'done');
                })
                ->whereBetween('tanggal_visit', [$startOfMonth, $endOfMonth])
                ->count();
            
            // 4. This Month Target - (completed / total assigned this month) * 100
            $totalAssignedThisMonth = PlanVisit::where('assigned_to', $user->id)
                ->whereBetween('tanggal_visit', [$startOfMonth, $endOfMonth])
                ->count();
            
            $monthlyCompletion = $totalAssignedThisMonth > 0 
                ? round(($completedVisitsCount / $totalAssignedThisMonth) * 100, 1)
                : 0;
            
            // 5. Check today's attendance
            $todayAttendance = Attendance::where('user_id', $user->id)
                ->whereDate('date', $today)
                ->whereNotNull('check_in_time')
                ->exists();
            
            // 6. Get My Customers (max 5) - optimized with select
            $myCustomers = Customer::select('id', 'name', 'company', 'phone', 'email', 'address', 'approval_status')
                ->where('created_by', $user->id)
                ->where('approval_status', 'approved')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'company' => $customer->company,
                        'phone' => $customer->phone,
                        'email' => $customer->email,
                        'address' => $customer->address,
                        'approval_status' => $customer->approval_status
                    ];
                });
            
            // 7. Get My Assigned Visits (max 5 upcoming/pending) - optimized with select
            $myVisits = PlanVisit::select('id', 'customer_id', 'tanggal_visit', 'waktu_visit', 'lokasi', 'tujuan', 'status')
                ->with([
                    'customer:id,name,company',
                    'realisasiVisit:id,plan_visit_id,status'
                ])
                ->where('assigned_to', $user->id)
                ->whereIn('status', ['pending', 'approved', 'scheduled'])
                ->whereDoesntHave('realisasiVisit')
                ->where('tanggal_visit', '>=', $today)
                ->orderBy('tanggal_visit', 'asc')
                ->limit(5)
                ->get()
                ->map(function($visit) {
                    return [
                        'id' => $visit->id,
                        'customer' => [
                            'id' => $visit->customer->id ?? null,
                            'name' => $visit->customer->name ?? 'Unknown',
                            'company' => $visit->customer->company ?? ''
                        ],
                        'tanggal_visit' => $visit->tanggal_visit,
                        'waktu_visit' => $visit->waktu_visit,
                        'lokasi' => $visit->lokasi,
                        'tujuan' => $visit->tujuan,
                        'status' => $visit->status
                    ];
                });
            
            // 8. Performance This Month
            $monthlyVisits = PlanVisit::where('assigned_to', $user->id)
                ->whereBetween('tanggal_visit', [$startOfMonth, $endOfMonth])
                ->count();
            
            // Count completed via realisasi_visits
            $monthlyCompleted = PlanVisit::where('assigned_to', $user->id)
                ->whereHas('realisasiVisit', function($query) {
                    $query->where('status', 'done');
                })
                ->whereBetween('tanggal_visit', [$startOfMonth, $endOfMonth])
                ->count();
            
            // Count missed via realisasi_visits or cancelled status
            $monthlyMissed = PlanVisit::where('assigned_to', $user->id)
                ->where(function($query) {
                    $query->where('status', 'cancelled')
                          ->orWhereHas('realisasiVisit', function($q) {
                              $q->where('status', 'missed');
                          });
                })
                ->whereBetween('tanggal_visit', [$startOfMonth, $endOfMonth])
                ->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'my_customers' => $myCustomersCount,
                        'assigned_visits' => $assignedVisitsCount,
                        'completed_visits' => $completedVisitsCount,
                        'monthly_completion' => $monthlyCompletion,
                        'monthly_visits' => $monthlyVisits,
                        'monthly_completed' => $monthlyCompleted,
                        'monthly_missed' => $monthlyMissed
                    ],
                    'my_customers' => $myCustomers,
                    'my_visits' => $myVisits,
                    'today_attendance' => $todayAttendance,
                    'attendance_warning' => !$todayAttendance
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Sales dashboard error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my unplanned visits (created by this sales)
     */
    public function getMyUnplannedVisits(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Show ALL unplanned visits (including completed ones)
            $unplannedVisits = RealisasiVisit::where('type', 'unplanned')
                ->where('visited_by', $user->id)
                ->with(['directCustomer', 'approver'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($visit) {
                    return [
                        'id' => $visit->id,
                        'type' => 'unplanned',
                        'customer_name' => $visit->customer_name ?? $visit->directCustomer->name ?? 'Unknown',
                        'customer_company' => $visit->customer_company ?? $visit->directCustomer->company ?? '',
                        'customer_phone' => $visit->customer_phone ?? $visit->directCustomer->phone ?? '',
                        'customer_address' => $visit->customer_address ?? $visit->directCustomer->address ?? '',
                        'visit_date' => $visit->visit_date,
                        'visit_time' => $visit->visit_time,
                        'visit_purpose' => $visit->visit_purpose,
                        'meeting_notes' => $visit->meeting_notes,
                        'visit_outcome' => $visit->visit_outcome,
                        'deal_amount' => $visit->deal_amount,
                        'deal_notes' => $visit->deal_notes,
                        'status' => $visit->status,
                        'approval_status' => $visit->approval_status,
                        'approved_by' => $visit->approver->name ?? null,
                        'approved_at' => $visit->approved_at ? \Carbon\Carbon::parse($visit->approved_at)->format('Y-m-d H:i') : null,
                        'rejection_reason' => $visit->rejection_reason,
                        'created_at' => \Carbon\Carbon::parse($visit->created_at)->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $unplannedVisits
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load unplanned visits: ' . $e->getMessage()
            ], 500);
        }
    }
}
