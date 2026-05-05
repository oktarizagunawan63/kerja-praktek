<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VisitReportController extends Controller
{
    public function getDashboardStats(): JsonResponse
    {
        try {
            $user = request()->user();
            
            // Get counts based on user role
            $totalCustomers = DB::table('customers')->count();
            $totalPlanVisits = DB::table('plan_visits')->count();
            $completedVisits = DB::table('realisasi_visits')->where('status', 'done')->count();
            $totalSales = DB::table('users')->where('role', 'sales')->where('is_active', true)->count();
            
            // If sales manager, filter by their data
            if ($user->role === 'sales_manager') {
                $totalCustomers = DB::table('customers')->where('created_by', $user->id)->count();
                $totalPlanVisits = DB::table('plan_visits')->where('created_by', $user->id)->count();
                $completedVisits = DB::table('realisasi_visits')
                    ->join('plan_visits', 'realisasi_visits.plan_visit_id', '=', 'plan_visits.id')
                    ->where('plan_visits.created_by', $user->id)
                    ->where('realisasi_visits.status', 'done')
                    ->count();
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_customers' => $totalCustomers,
                    'total_plan_visits' => $totalPlanVisits,
                    'completed_visits' => $completedVisits,
                    'total_sales' => $totalSales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading dashboard stats: ' . $e->getMessage(),
                'data' => [
                    'total_customers' => 0,
                    'total_plan_visits' => 0,
                    'completed_visits' => 0,
                    'total_sales' => 0
                ]
            ]);
        }
    }

    public function getMySalesStats(): JsonResponse
    {
        try {
            $user = request()->user();
            
            $visits = 0;
            $completed = 0;
            
            if ($user->role === 'sales') {
                // For sales, get visits assigned to them
                $visits = DB::table('plan_visits')->where('assigned_to', $user->id)->count();
                $completed = DB::table('realisasi_visits')
                    ->join('plan_visits', 'realisasi_visits.plan_visit_id', '=', 'plan_visits.id')
                    ->where('plan_visits.assigned_to', $user->id)
                    ->where('realisasi_visits.status', 'done')
                    ->count();
            } elseif ($user->role === 'sales_manager') {
                // For sales manager, get all visits they created
                $visits = DB::table('plan_visits')->where('created_by', $user->id)->count();
                $completed = DB::table('realisasi_visits')
                    ->join('plan_visits', 'realisasi_visits.plan_visit_id', '=', 'plan_visits.id')
                    ->where('plan_visits.created_by', $user->id)
                    ->where('realisasi_visits.status', 'done')
                    ->count();
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'visits' => $visits,
                    'completed' => $completed
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading sales stats: ' . $e->getMessage(),
                'data' => [
                    'visits' => 0,
                    'completed' => 0
                ]
            ]);
        }
    }

    public function getVisitReport(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
            
            // Base query for plan visits
            $planVisitsQuery = DB::table('plan_visits')
                ->whereBetween('tanggal_visit', [$startDate, $endDate]);
            
            // Filter by user role
            if ($user->role === 'sales') {
                $planVisitsQuery->where('assigned_to', $user->id);
            } elseif ($user->role === 'sales_manager') {
                $planVisitsQuery->where('created_by', $user->id);
            }
            
            $totalVisits = $planVisitsQuery->count();
            
            // Get completed visits
            $completedVisits = DB::table('realisasi_visits')
                ->join('plan_visits', 'realisasi_visits.plan_visit_id', '=', 'plan_visits.id')
                ->whereBetween('plan_visits.tanggal_visit', [$startDate, $endDate])
                ->where('realisasi_visits.status', 'done')
                ->when($user->role === 'sales', function($q) use ($user) {
                    return $q->where('plan_visits.assigned_to', $user->id);
                })
                ->when($user->role === 'sales_manager', function($q) use ($user) {
                    return $q->where('plan_visits.created_by', $user->id);
                })
                ->count();
            
            // Get missed visits
            $missedVisits = DB::table('realisasi_visits')
                ->join('plan_visits', 'realisasi_visits.plan_visit_id', '=', 'plan_visits.id')
                ->whereBetween('plan_visits.tanggal_visit', [$startDate, $endDate])
                ->where('realisasi_visits.status', 'missed')
                ->when($user->role === 'sales', function($q) use ($user) {
                    return $q->where('plan_visits.assigned_to', $user->id);
                })
                ->when($user->role === 'sales_manager', function($q) use ($user) {
                    return $q->where('plan_visits.created_by', $user->id);
                })
                ->count();
            
            $performanceRate = $totalVisits > 0 ? round(($completedVisits / $totalVisits) * 100, 2) : 0;
            
            // Get daily data for chart
            $periodData = DB::table('plan_visits')
                ->selectRaw('DATE(tanggal_visit) as date, COUNT(*) as planned')
                ->whereBetween('tanggal_visit', [$startDate, $endDate])
                ->when($user->role === 'sales', function($q) use ($user) {
                    return $q->where('assigned_to', $user->id);
                })
                ->when($user->role === 'sales_manager', function($q) use ($user) {
                    return $q->where('created_by', $user->id);
                })
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function($item) use ($user) {
                    // Get completed count for this date
                    $completed = DB::table('realisasi_visits')
                        ->join('plan_visits', 'realisasi_visits.plan_visit_id', '=', 'plan_visits.id')
                        ->whereDate('plan_visits.tanggal_visit', $item->date)
                        ->where('realisasi_visits.status', 'done')
                        ->when($user->role === 'sales', function($q) use ($user) {
                            return $q->where('plan_visits.assigned_to', $user->id);
                        })
                        ->when($user->role === 'sales_manager', function($q) use ($user) {
                            return $q->where('plan_visits.created_by', $user->id);
                        })
                        ->count();
                    
                    return [
                        'date' => $item->date,
                        'planned' => $item->planned,
                        'completed' => $completed,
                        'rate' => $item->planned > 0 ? round(($completed / $item->planned) * 100, 2) : 0
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_visits' => $totalVisits,
                        'completed_visits' => $completedVisits,
                        'missed_visits' => $missedVisits,
                        'performance_rate' => $performanceRate
                    ],
                    'period_data' => $periodData
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading visit report: ' . $e->getMessage(),
                'data' => [
                    'summary' => [
                        'total_visits' => 0,
                        'completed_visits' => 0,
                        'missed_visits' => 0,
                        'performance_rate' => 0
                    ],
                    'period_data' => []
                ]
            ], 500);
        }
    }

    public function getSalesPerformance(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
            
            // Get sales performance data
            $salesPerformance = DB::table('users')
                ->select([
                    'users.id',
                    'users.name',
                    'users.email',
                    DB::raw('COUNT(DISTINCT plan_visits.id) as total_visits'),
                    DB::raw('COUNT(DISTINCT CASE WHEN realisasi_visits.status = "done" THEN realisasi_visits.id END) as completed_visits'),
                    DB::raw('COUNT(DISTINCT CASE WHEN realisasi_visits.status = "missed" THEN realisasi_visits.id END) as missed_visits')
                ])
                ->leftJoin('plan_visits', function($join) use ($startDate, $endDate) {
                    $join->on('users.id', '=', 'plan_visits.assigned_to')
                         ->whereBetween('plan_visits.tanggal_visit', [$startDate, $endDate]);
                })
                ->leftJoin('realisasi_visits', 'plan_visits.id', '=', 'realisasi_visits.plan_visit_id')
                ->where('users.role', 'sales')
                ->where('users.is_active', true)
                ->when($user->role === 'sales_manager', function($q) use ($user) {
                    // Sales manager only sees their team's performance
                    return $q->whereExists(function($subquery) use ($user) {
                        $subquery->select(DB::raw(1))
                                ->from('plan_visits as pv')
                                ->whereRaw('pv.assigned_to = users.id')
                                ->where('pv.created_by', $user->id);
                    });
                })
                ->groupBy('users.id', 'users.name', 'users.email')
                ->get()
                ->map(function($item) {
                    $performanceRate = $item->total_visits > 0 ? 
                        round(($item->completed_visits / $item->total_visits) * 100, 2) : 0;
                    
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'email' => $item->email,
                        'total_visits' => $item->total_visits,
                        'completed_visits' => $item->completed_visits,
                        'missed_visits' => $item->missed_visits,
                        'performance_rate' => $performanceRate
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $salesPerformance
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading sales performance: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function getCustomerVisitHistory($id): JsonResponse
    {
        try {
            $user = request()->user();
            
            // Get customer visit history
            $visitHistory = DB::table('plan_visits')
                ->select([
                    'plan_visits.*',
                    'customers.name as customer_name',
                    'customers.company as customer_company',
                    'assigned_user.name as assigned_to_name',
                    'creator.name as created_by_name',
                    'realisasi_visits.status as realisasi_status',
                    'realisasi_visits.visit_time',
                    'realisasi_visits.notes as realisasi_notes'
                ])
                ->join('customers', 'plan_visits.customer_id', '=', 'customers.id')
                ->leftJoin('users as assigned_user', 'plan_visits.assigned_to', '=', 'assigned_user.id')
                ->leftJoin('users as creator', 'plan_visits.created_by', '=', 'creator.id')
                ->leftJoin('realisasi_visits', 'plan_visits.id', '=', 'realisasi_visits.plan_visit_id')
                ->where('plan_visits.customer_id', $id)
                ->when($user->role === 'sales', function($q) use ($user) {
                    return $q->where('plan_visits.assigned_to', $user->id);
                })
                ->when($user->role === 'sales_manager', function($q) use ($user) {
                    return $q->where('plan_visits.created_by', $user->id);
                })
                ->orderBy('plan_visits.tanggal_visit', 'desc')
                ->get()
                ->map(function($visit) {
                    return [
                        'id' => $visit->id,
                        'customer_name' => $visit->customer_name,
                        'customer_company' => $visit->customer_company,
                        'tanggal_visit' => $visit->tanggal_visit,
                        'lokasi' => $visit->lokasi,
                        'keterangan' => $visit->keterangan,
                        'assigned_to_name' => $visit->assigned_to_name,
                        'created_by_name' => $visit->created_by_name,
                        'realisasi_status' => $visit->realisasi_status ?? 'pending',
                        'visit_time' => $visit->visit_time,
                        'realisasi_notes' => $visit->realisasi_notes,
                        'created_at' => $visit->created_at,
                        'updated_at' => $visit->updated_at
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $visitHistory
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading customer visit history: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}