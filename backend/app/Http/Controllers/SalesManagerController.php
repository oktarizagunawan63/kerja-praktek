<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Customer;
use App\Models\PlanVisit;
use App\Models\RealisasiVisit;
use App\Models\Warning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesManagerController extends Controller
{
    /**
     * Get sales manager dashboard (alias for getDashboardStats)
     */
    public function dashboard(Request $request)
    {
        return $this->getDashboardStats($request);
    }

    /**
     * Get sales manager dashboard statistics
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get customers managed by this sales manager or their team
            $salesTeam = User::where('role', 'sales')
                ->where('is_active', true)
                ->pluck('id');
            
            $teamIds = $salesTeam->push($user->id); // Include sales manager

            // Customer statistics
            $totalCustomers = Customer::whereIn('created_by', $teamIds)->count();
            $newCustomersThisMonth = Customer::whereIn('created_by', $teamIds)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            // Visit statistics
            $totalVisits = PlanVisit::whereIn('created_by', $teamIds)->count();
            $completedVisits = PlanVisit::whereIn('created_by', $teamIds)
                ->whereHas('realisasiVisit', function($q) {
                    $q->where('status', 'done');
                })
                ->count();
            
            $pendingVisits = PlanVisit::whereIn('created_by', $teamIds)
                ->whereDoesntHave('realisasiVisit')
                ->orWhereHas('realisasiVisit', function($q) {
                    $q->where('status', 'pending');
                })
                ->count();

            $missedVisits = PlanVisit::whereIn('created_by', $teamIds)
                ->whereHas('realisasiVisit', function($q) {
                    $q->where('status', 'missed');
                })
                ->count();

            // This month's visits
            $visitsThisMonth = PlanVisit::whereIn('created_by', $teamIds)
                ->whereMonth('tanggal_visit', now()->month)
                ->whereYear('tanggal_visit', now()->year)
                ->count();

            $completedThisMonth = PlanVisit::whereIn('created_by', $teamIds)
                ->whereMonth('tanggal_visit', now()->month)
                ->whereYear('tanggal_visit', now()->year)
                ->whereHas('realisasiVisit', function($q) {
                    $q->where('status', 'done');
                })
                ->count();

            // Completion rate
            $completionRate = $totalVisits > 0 ? round(($completedVisits / $totalVisits) * 100, 2) : 0;
            $monthlyCompletionRate = $visitsThisMonth > 0 ? round(($completedThisMonth / $visitsThisMonth) * 100, 2) : 0;

            // Sales team performance - optimized with single query
            $salesIds = User::where('role', 'sales')
                ->where('is_active', true)
                ->pluck('id');
            
            // Get counts in bulk
            $customerCounts = Customer::whereIn('created_by', $salesIds)
                ->select('created_by', DB::raw('count(*) as count'))
                ->groupBy('created_by')
                ->pluck('count', 'created_by');
            
            $visitCounts = PlanVisit::whereIn('assigned_to', $salesIds)
                ->select('assigned_to', DB::raw('count(*) as count'))
                ->groupBy('assigned_to')
                ->pluck('count', 'assigned_to');
            
            $completedCounts = PlanVisit::whereIn('assigned_to', $salesIds)
                ->whereHas('realisasiVisit', function($q) {
                    $q->where('status', 'done');
                })
                ->select('assigned_to', DB::raw('count(*) as count'))
                ->groupBy('assigned_to')
                ->pluck('count', 'assigned_to');
            
            $salesPerformance = User::select('id', 'name', 'email')
                ->where('role', 'sales')
                ->where('is_active', true)
                ->get()
                ->map(function($sales) use ($customerCounts, $visitCounts, $completedCounts) {
                    $customerCount = $customerCounts[$sales->id] ?? 0;
                    $visitCount = $visitCounts[$sales->id] ?? 0;
                    $completedCount = $completedCounts[$sales->id] ?? 0;
                    
                    return [
                        'id' => $sales->id,
                        'name' => $sales->name,
                        'email' => $sales->email,
                        'customers' => $customerCount,
                        'visits' => $visitCount,
                        'completed' => $completedCount,
                        'completion_rate' => $visitCount > 0 ? round(($completedCount / $visitCount) * 100, 2) : 0
                    ];
                });

            // Recent customers - optimized with select
            $recentCustomers = Customer::select('id', 'name', 'company', 'phone', 'created_by', 'created_at')
                ->whereIn('created_by', $teamIds)
                ->with(['creator:id,name'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'company' => $customer->company,
                        'phone' => $customer->phone,
                        'created_by' => $customer->creator->name ?? 'Unknown',
                        'created_at' => $customer->created_at->format('Y-m-d H:i')
                    ];
                });

            // Upcoming visits - optimized with select
            $upcomingVisits = PlanVisit::select('id', 'customer_id', 'tanggal_visit', 'lokasi', 'assigned_to')
                ->whereIn('created_by', $teamIds)
                ->where('tanggal_visit', '>=', now()->format('Y-m-d'))
                ->with([
                    'customer:id,name,company',
                    'assignedTo:id,name',
                    'realisasiVisit:id,plan_visit_id,status'
                ])
                ->orderBy('tanggal_visit', 'asc')
                ->limit(5)
                ->get()
                ->map(function($visit) {
                    return [
                        'id' => $visit->id,
                        'customer_name' => $visit->customer->name ?? 'Unknown',
                        'customer_company' => $visit->customer->company ?? '',
                        'tanggal_visit' => $visit->tanggal_visit,
                        'lokasi' => $visit->lokasi,
                        'assigned_to' => $visit->assignedTo->name ?? 'Unassigned',
                        'status' => $visit->realisasiVisit->status ?? 'pending'
                    ];
                });

            // Warnings
            $activeWarnings = Warning::whereIn('user_id', $teamIds)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'customers' => [
                        'total' => $totalCustomers,
                        'new_this_month' => $newCustomersThisMonth
                    ],
                    'visits' => [
                        'total' => $totalVisits,
                        'completed' => $completedVisits,
                        'pending' => $pendingVisits,
                        'missed' => $missedVisits,
                        'this_month' => $visitsThisMonth,
                        'completed_this_month' => $completedThisMonth,
                        'completion_rate' => $completionRate,
                        'monthly_completion_rate' => $monthlyCompletionRate
                    ],
                    'team' => [
                        'sales_count' => $salesTeam->count(),
                        'performance' => $salesPerformance
                    ],
                    'warnings' => [
                        'active_count' => $activeWarnings
                    ],
                    'recent_customers' => $recentCustomers,
                    'upcoming_visits' => $upcomingVisits
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
     * Get customers for sales manager
     */
    public function getCustomers(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get customers created by sales manager or their team
            $salesTeam = User::where('role', 'sales')
                ->where('is_active', true)
                ->pluck('id');
            
            $teamIds = $salesTeam->push($user->id);

            $customers = Customer::whereIn('created_by', $teamIds)
                ->with('creator')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'company' => $customer->company,
                        'phone' => $customer->phone,
                        'email' => $customer->email,
                        'address' => $customer->address,
                        'latitude' => $customer->latitude,
                        'longitude' => $customer->longitude,
                        'created_by' => $customer->creator->name ?? 'Unknown',
                        'created_at' => $customer->created_at->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get plan visits for sales manager
     */
    public function getPlanVisits(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get visits created by sales manager or assigned to their team
            $salesTeam = User::where('role', 'sales')
                ->where('is_active', true)
                ->pluck('id');
            
            $teamIds = $salesTeam->push($user->id);

            $planVisits = PlanVisit::whereIn('created_by', $teamIds)
                ->orWhereIn('assigned_to', $salesTeam)
                ->with(['customer', 'assignedTo', 'creator', 'realisasiVisit'])
                ->orderBy('tanggal_visit', 'desc')
                ->get()
                ->map(function($visit) {
                    return [
                        'id' => $visit->id,
                        'customer_id' => $visit->customer_id,
                        'customer_name' => $visit->customer->name ?? 'Unknown',
                        'customer_company' => $visit->customer->company ?? '',
                        'tanggal_visit' => $visit->tanggal_visit,
                        'lokasi' => $visit->lokasi,
                        'keterangan' => $visit->keterangan,
                        'assigned_to' => $visit->assignedTo->name ?? 'Unassigned',
                        'assigned_to_id' => $visit->assigned_to,
                        'created_by' => $visit->creator->name ?? 'Unknown',
                        'status' => $visit->realisasiVisit->status ?? 'pending',
                        'realisasi_id' => $visit->realisasiVisit->id ?? null,
                        'created_at' => $visit->created_at->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $planVisits
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load plan visits: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get visit realizations for sales manager
     */
    public function getVisitRealizations(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get realizations for visits created by sales manager or assigned to their team
            $salesTeam = User::where('role', 'sales')
                ->where('is_active', true)
                ->pluck('id');
            
            $teamIds = $salesTeam->push($user->id);

            $realizations = RealisasiVisit::whereHas('planVisit', function($q) use ($teamIds, $salesTeam) {
                    $q->whereIn('created_by', $teamIds)
                      ->orWhereIn('assigned_to', $salesTeam);
                })
                ->with(['planVisit.customer', 'visitedBy'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($realisasi) {
                    return [
                        'id' => $realisasi->id,
                        'plan_visit_id' => $realisasi->plan_visit_id,
                        'customer_name' => $realisasi->planVisit->customer->name ?? 'Unknown',
                        'customer_company' => $realisasi->planVisit->customer->company ?? '',
                        'planned_date' => $realisasi->planVisit->tanggal_visit,
                        'actual_date' => $realisasi->visit_time ? $realisasi->visit_time->format('Y-m-d H:i') : null,
                        'status' => $realisasi->status,
                        'notes' => $realisasi->notes,
                        'latitude' => $realisasi->latitude,
                        'longitude' => $realisasi->longitude,
                        'photos' => json_decode($realisasi->photos ?? '[]', true),
                        'visited_by' => $realisasi->visitedBy->name ?? 'Unknown',
                        'created_at' => $realisasi->created_at->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $realizations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load visit realizations: ' . $e->getMessage()
            ], 500);
        }
    }
}

    /**
     * Get pending unplanned visits for approval
     */
    public function getPendingUnplannedVisits(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get sales team IDs
            $salesTeam = User::where('role', 'sales')
                ->where('is_active', true)
                ->pluck('id');

            // Get unplanned visits that need approval
            $pendingVisits = RealisasiVisit::where('type', 'unplanned')
                ->where('approval_status', 'pending')
                ->whereIn('visited_by', $salesTeam)
                ->with(['visitor', 'directCustomer'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($visit) {
                    return [
                        'id' => $visit->id,
                        'type' => $visit->type,
                        'customer_id' => $visit->customer_id,
                        'customer_name' => $visit->customer_name ?? $visit->directCustomer->name ?? 'Unknown',
                        'customer_company' => $visit->customer_company ?? $visit->directCustomer->company ?? '',
                        'customer_phone' => $visit->customer_phone ?? $visit->directCustomer->phone ?? '',
                        'customer_address' => $visit->customer_address ?? $visit->directCustomer->address ?? '',
                        'visit_date' => $visit->visit_date,
                        'visit_time' => $visit->visit_time ? $visit->visit_time->format('Y-m-d H:i') : null,
                        'visit_purpose' => $visit->visit_purpose,
                        'meeting_notes' => $visit->meeting_notes,
                        'visit_outcome' => $visit->visit_outcome,
                        'deal_amount' => $visit->deal_amount,
                        'deal_notes' => $visit->deal_notes,
                        'status' => $visit->status,
                        'approval_status' => $visit->approval_status,
                        'latitude' => $visit->latitude,
                        'longitude' => $visit->longitude,
                        'photos' => $visit->photos,
                        'visited_by' => $visit->visitor->name ?? 'Unknown',
                        'visited_by_id' => $visit->visited_by,
                        'created_at' => $visit->created_at->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $pendingVisits
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load pending unplanned visits: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve unplanned visit
     */
    public function approveUnplannedVisit(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            $visit = RealisasiVisit::where('type', 'unplanned')
                ->where('id', $id)
                ->where('approval_status', 'pending')
                ->firstOrFail();

            $visit->update([
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Unplanned visit approved successfully',
                'data' => $visit
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve unplanned visit: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject unplanned visit
     */
    public function rejectUnplannedVisit(Request $request, $id)
    {
        try {
            $request->validate([
                'rejection_reason' => 'required|string|max:500'
            ]);

            $user = $request->user();
            
            $visit = RealisasiVisit::where('type', 'unplanned')
                ->where('id', $id)
                ->where('approval_status', 'pending')
                ->firstOrFail();

            $visit->update([
                'approval_status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Unplanned visit rejected',
                'data' => $visit
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject unplanned visit: ' . $e->getMessage()
            ], 500);
        }
    }
}
