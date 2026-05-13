<?php

namespace App\Http\Controllers;

use App\Models\SalesFunnel;
use App\Models\FunnelActivity;
use App\Models\ProjectNotification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

// Helper to send notification
function sendNotif($userId, $type, $title, $message, $metadata = null) {
    try {
        ProjectNotification::create([
            'user_id' => $userId,
            'project_id' => null,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'is_read' => false,
            'metadata' => $metadata ? json_encode($metadata) : null,
        ]);
    } catch (\Exception $e) {
        \Log::error('Notification error: ' . $e->getMessage());
    }
}

class SalesFunnelController extends Controller
{
    /**
     * Get funnels list with filters
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = SalesFunnel::with(['customer', 'assignedUser', 'creator', 'activities']);
            
            // Access control
            if ($user->role === 'sales') {
                $query->where('assigned_to', $user->id);
            } elseif ($user->role === 'sales_manager') {
                // Sales manager can see all sales funnels (no hierarchy filter for now)
                // TODO: Add created_by column to users table if hierarchy is needed
                $salesIds = \App\Models\User::where('role', 'sales')
                    ->pluck('id')
                    ->toArray();
                $salesIds[] = $user->id; // Include manager's own funnels
                $query->whereIn('assigned_to', $salesIds);
            }
            // Admin can see all
            
            // Filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            if ($request->has('segment')) {
                $query->where('segment', $request->segment);
            }
            
            if ($request->has('channel')) {
                $query->where('channel', $request->channel);
            }
            
            if ($request->has('deal_stage')) {
                $query->where('deal_stage', $request->deal_stage);
            }
            
            if ($request->has('win_probability')) {
                $query->where('win_probability', $request->win_probability);
            }
            
            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->assigned_to);
            }
            
            if ($request->has('month')) {
                $month = $request->month;
                $query->whereMonth('created_at', $month);
            }
            
            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_company', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%");
                });
            }
            
            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            if ($sortBy === 'deadline_terdekat') {
                $query->orderBy('target_close_date', 'asc');
            } elseif ($sortBy === 'last_update') {
                $query->orderBy('updated_at', 'desc');
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }
            
            $funnels = $query->paginate($request->get('per_page', 15));
            
            return response()->json([
                'success' => true,
                'data' => $funnels
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load funnels: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get funnel statistics
     */
    public function stats(Request $request)
    {
        try {
            $user = Auth::user();
            $query = SalesFunnel::query();
            
            // Access control
            if ($user->role === 'sales') {
                $query->where('assigned_to', $user->id);
            } elseif ($user->role === 'sales_manager') {
                $salesIds = \App\Models\User::where('role', 'sales')
                    ->pluck('id')
                    ->toArray();
                $salesIds[] = $user->id;
                $query->whereIn('assigned_to', $salesIds);
            }
            
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();
            
            // Total Deal Open (count of all open deals)
            $totalDealOpen = (clone $query)->where('status', 'open')->count();
            
            // Total Menang Bulan Ini (sum of estimated_value for won deals)
            $totalMenangBulanIni = (clone $query)
                ->where('status', 'won')
                ->whereBetween('won_date', [$startOfMonth, $endOfMonth])
                ->sum('estimated_value');
            
            // Win Rate Bulan Ini
            $totalClosedThisMonth = (clone $query)
                ->whereIn('status', ['won', 'lost'])
                ->whereBetween('updated_at', [$startOfMonth, $endOfMonth])
                ->count();
            
            $totalWonThisMonth = (clone $query)
                ->where('status', 'won')
                ->whereBetween('won_date', [$startOfMonth, $endOfMonth])
                ->count();
            
            $winRate = $totalClosedThisMonth > 0 
                ? round(($totalWonThisMonth / $totalClosedThisMonth) * 100, 1)
                : 0;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_deal_open' => $totalDealOpen,
                    'total_menang_bulan_ini' => $totalMenangBulanIni,
                    'win_rate_bulan_ini' => $winRate
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel stats error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new funnel
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            $validator = Validator::make($request->all(), [
                'customer_id' => 'nullable|exists:customers,id',
                'customer_name' => 'required|string|max:255',
                'customer_company' => 'required|string|max:255',
                'customer_phone' => 'nullable|string|max:50',
                'customer_email' => 'nullable|email',
                'channel' => 'required|in:kontraktor,subdist,rsud,rs_swasta,klinik,puskesmas,lainnya',
                'channel_other' => 'required_if:channel,lainnya|nullable|string',
                'city' => 'required|string|max:255',
                'province' => 'nullable|string|max:255',
                'segment' => 'required|in:sot,igvm,nursecall,umum',
                'segment_custom' => 'required_if:segment,umum|nullable|string',
                'qty' => 'required|numeric|min:0',
                'unit' => 'required|in:unit,set,pcs',
                'estimated_value' => 'nullable|numeric|min:0',
                'deal_stage' => 'required|in:prospek,qualified,proposal,negosiasi,closing',
                'deadline_date' => 'required|date',
                'target_close_date' => 'required|date',
                'win_probability' => 'required|in:low,middle,high,very_high',
                'win_percentage' => 'nullable|integer|min:0|max:100',
                'initial_notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:users,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
            // Default estimated_value if not provided
            if (!isset($data['estimated_value'])) {
                $data['estimated_value'] = 0;
            }

            // Default initial_notes to empty string if not provided (field removed from UI)
            if (!isset($data['initial_notes']) || empty($data['initial_notes'])) {
                $data['initial_notes'] = '';
            }

            // Auto-assign
            if (!isset($data['assigned_to'])) {
                $data['assigned_to'] = $user->id;
            } elseif ($user->role === 'sales' && $data['assigned_to'] != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sales can only assign to themselves'
                ], 403);
            }
            
            // Auto-calculate win percentage if not provided
            if (!isset($data['win_percentage'])) {
                $data['win_percentage'] = SalesFunnel::getWinPercentageByProbability($data['win_probability']);
            }
            
            $data['created_by'] = $user->id;
            $data['status'] = 'open';
            
            $funnel = SalesFunnel::create($data);
            
            // Create initial activity only if notes provided
            if (!empty($data['initial_notes'])) {
                FunnelActivity::create([
                    'funnel_id' => $funnel->id,
                    'activity_type' => 'lainnya',
                    'activity_date' => now(),
                    'notes' => 'Funnel created: ' . $data['initial_notes'],
                    'created_by' => $user->id
                ]);
            }

            // Notify Sales Managers & Admins about new funnel
            $managers = User::whereIn('role', ['sales_manager', 'administrator'])->get();
            foreach ($managers as $mgr) {
                if ($mgr->id !== $user->id) {
                    sendNotif($mgr->id, 'info',
                        '📋 Funnel Baru Ditambahkan',
                        "{$user->name} menambahkan funnel baru: {$funnel->customer_name} ({$funnel->customer_company}) — {$funnel->segment}"
                    );
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Funnel berhasil dibuat',
                'data' => $funnel->load(['assignedUser', 'creator'])
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Funnel store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create funnel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show funnel detail
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            $funnel = SalesFunnel::with(['customer', 'assignedUser', 'creator', 'activities.creator'])
                ->findOrFail($id);
            
            // Access control
            if ($user->role === 'sales' && $funnel->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            if ($user->role === 'sales_manager') {
                // Sales manager can see all sales funnels (no hierarchy check)
                $salesIds = \App\Models\User::where('role', 'sales')
                    ->pluck('id')
                    ->toArray();
                $salesIds[] = $user->id;
                
                if (!in_array($funnel->assigned_to, $salesIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized access'
                    ], 403);
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => $funnel
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load funnel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update funnel
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $funnel = SalesFunnel::findOrFail($id);
            
            // Access control — administrator can edit all including won/lost
            if (!in_array($user->role, ['administrator']) && $funnel->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot edit won/lost funnel'
                ], 403);
            }
            
            if ($user->role === 'sales' && $funnel->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'customer_id' => 'nullable|exists:customers,id',
                'customer_name' => 'sometimes|required|string|max:255',
                'customer_company' => 'sometimes|required|string|max:255',
                'customer_phone' => 'nullable|string|max:50',
                'customer_email' => 'nullable|email',
                'channel' => 'sometimes|required|in:kontraktor,subdist,rsud,rs_swasta,klinik,puskesmas,lainnya',
                'channel_other' => 'required_if:channel,lainnya|nullable|string',
                'city' => 'sometimes|required|string|max:255',
                'province' => 'nullable|string|max:255',
                'segment' => 'sometimes|required|in:sot,igvm,nursecall,umum',
                'segment_custom' => 'required_if:segment,umum|nullable|string',
                'qty' => 'sometimes|required|numeric|min:0',
                'unit' => 'sometimes|required|in:unit,set,pcs',
                'estimated_value' => 'nullable|numeric|min:0',
                'deal_stage' => 'sometimes|required|in:prospek,qualified,proposal,negosiasi,closing',
                'deadline_date' => 'sometimes|required|date',
                'target_close_date' => 'sometimes|required|date',
                'win_probability' => 'sometimes|required|in:low,middle,high,very_high',
                'win_percentage' => 'nullable|integer|min:0|max:100',
                'initial_notes' => 'nullable|string'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
            // Track stage change
            $oldStage = $funnel->deal_stage;
            $oldProbability = $funnel->win_probability;
            
            $funnel->update($data);
            
            // Auto-log stage change
            if (isset($data['deal_stage']) && $oldStage !== $data['deal_stage']) {
                FunnelActivity::create([
                    'funnel_id' => $funnel->id,
                    'activity_type' => 'lainnya',
                    'activity_date' => now(),
                    'notes' => "Deal stage changed from {$oldStage} to {$data['deal_stage']}",
                    'previous_stage' => $oldStage,
                    'new_stage' => $data['deal_stage'],
                    'created_by' => $user->id
                ]);
            }
            
            // Auto-log probability change
            if (isset($data['win_probability']) && $oldProbability !== $data['win_probability']) {
                FunnelActivity::create([
                    'funnel_id' => $funnel->id,
                    'activity_type' => 'lainnya',
                    'activity_date' => now(),
                    'notes' => "Win probability changed from {$oldProbability} to {$data['win_probability']}",
                    'previous_probability' => $oldProbability,
                    'new_probability' => $data['win_probability'],
                    'created_by' => $user->id
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Funnel berhasil diupdate',
                'data' => $funnel->load(['assignedUser', 'creator'])
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update funnel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete funnel (admin only)
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!in_array($user->role, ['administrator', 'sales_manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only administrator or sales manager can delete funnels'
                ], 403);
            }
            
            $funnel = SalesFunnel::findOrFail($id);
            $funnel->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Funnel berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete funnel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark funnel as won
     */
    public function markAsWon(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $funnel = SalesFunnel::findOrFail($id);
            
            // Access control — administrator bypass
            if ($user->role === 'sales' && $funnel->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            if ($funnel->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'Funnel is already closed'
                ], 400);
            }
            
            $validator = Validator::make($request->all(), [
                'won_reason_category' => 'required|in:harga_kompetitif,relasi,spesifikasi,after_sales,pengiriman,lainnya',
                'won_notes' => 'nullable|string',
                'won_date' => 'required|date'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            $data['status'] = 'won';
            $data['deal_stage'] = 'closing';
            $data['won_value'] = $funnel->estimated_value; // Use estimated value as won value
            
            $funnel->update($data);
            
            // Log activity
            $notesText = $data['won_notes'] ? ". Notes: {$data['won_notes']}" : "";
            FunnelActivity::create([
                'funnel_id' => $funnel->id,
                'activity_type' => 'lainnya',
                'activity_date' => now(),
                'notes' => "Deal WON! Reason: {$data['won_reason_category']}{$notesText}",
                'created_by' => $user->id
            ]);

            // Auto-create project for Site Manager dashboard
            $segmentLabel = strtoupper($funnel->segment ?? 'Umum');
            $projectName = "[FUNNEL] {$funnel->customer_company} - {$segmentLabel}";
            $descriptionNotes = $data['won_notes'] ? "\nCatatan: {$data['won_notes']}" : "";
            $project = Project::create([
                'name'        => $projectName,
                'description' => "Proyek dari Sales Funnel (WON).\nCustomer: {$funnel->customer_name}\nSegment: {$segmentLabel}\nNilai Estimasi: Rp " . number_format($funnel->estimated_value, 0, ',', '.') . $descriptionNotes,
                'location'    => $funnel->city ?? '-',
                'status'      => 'on_track',
                'start_date'  => now()->toDateString(),
                'end_date'    => $funnel->target_close_date ?? now()->addMonths(3)->toDateString(),
                'budget'      => $funnel->estimated_value,
                'budget_realisasi' => 0,
                'progress'    => 0,
                'pm_name'     => null,
                'pm_email'    => null,
                'project_manager_id' => $user->id, // Required field
            ]);

            // Notify Sales Manager, Admin, Site Manager about WON + new project
            $notifyRoles = User::whereIn('role', ['sales_manager', 'administrator', 'site_manager'])->get();
            foreach ($notifyRoles as $recipient) {
                sendNotif($recipient->id, 'success',
                    '🏆 Deal WON! Proyek Baru Dibuat',
                    "Funnel {$funnel->customer_name} ({$funnel->customer_company}) berhasil WON. Proyek '{$projectName}' telah dibuat dan menunggu assignment Site Manager.",
                    ['funnel_id' => $funnel->id, 'project_id' => $project->id]
                );
            }
            // Also notify the sales person
            if ($user->role !== 'sales') {
                sendNotif($funnel->assigned_to, 'success',
                    '🏆 Selamat! Deal Anda WON',
                    "Funnel {$funnel->customer_name} telah ditandai sebagai WON. Proyek baru telah dibuat untuk ditindaklanjuti."
                );
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Funnel berhasil ditandai sebagai menang! Proyek baru telah dibuat.',
                'data' => $funnel->load(['assignedUser', 'creator']),
                'project' => $project
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel markAsWon error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as won: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark funnel as lost
     */
    public function markAsLost(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $funnel = SalesFunnel::findOrFail($id);
            
            // Access control
            if ($user->role === 'sales' && $funnel->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            if ($funnel->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'Funnel is already closed'
                ], 400);
            }
            
            $validator = Validator::make($request->all(), [
                'lost_reason_category' => 'required|in:kalah_harga,kalah_spesifikasi,kalah_kompetitor,budget_dipotong,proyek_ditunda,customer_batal,lainnya',
                'lost_competitor' => 'required_if:lost_reason_category,kalah_kompetitor|nullable|string',
                'lost_notes' => 'nullable|string',
                'lost_date' => 'required|date'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            $data['status'] = 'lost';
            
            $funnel->update($data);
            
            // Log activity
            $notesText = $data['lost_notes'] ? ". Notes: {$data['lost_notes']}" : "";
            FunnelActivity::create([
                'funnel_id' => $funnel->id,
                'activity_type' => 'lainnya',
                'activity_date' => now(),
                'notes' => "Deal LOST. Reason: {$data['lost_reason_category']}{$notesText}",
                'created_by' => $user->id
            ]);

            // Notify Sales Manager & Admin
            $managers = User::whereIn('role', ['sales_manager', 'administrator'])->get();
            foreach ($managers as $mgr) {
                sendNotif($mgr->id, 'over_budget',
                    '❌ Deal Lost',
                    "Funnel {$funnel->customer_name} ({$funnel->customer_company}) ditandai LOST. Alasan: {$data['lost_reason_category']}.",
                    ['funnel_id' => $funnel->id]
                );
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Funnel berhasil ditandai sebagai kalah',
                'data' => $funnel->load(['assignedUser', 'creator'])
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel markAsLost error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as lost: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get visited customers for funnel creation
     * Returns customers that have been visited (have realisasi visit)
     */
    public function getVisitedCustomers(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Get customers that have been visited
            // Join with plan_visits and realisasi_visits to find visited customers
            $visitedCustomerIds = \DB::table('plan_visits')
                ->join('realisasi_visits', 'plan_visits.id', '=', 'realisasi_visits.plan_visit_id')
                ->where('realisasi_visits.status', 'done')
                ->distinct()
                ->pluck('plan_visits.customer_id');
            
            // Also get customers from unplanned visits (approved only)
            $unplannedCustomerIds = \DB::table('realisasi_visits')
                ->where('type', 'unplanned')
                ->where('approval_status', 'approved')
                ->whereNotNull('customer_id')
                ->distinct()
                ->pluck('customer_id');
            
            // Merge both lists
            $allVisitedCustomerIds = $visitedCustomerIds->merge($unplannedCustomerIds)->unique();
            
            // Get customer details
            $customers = \App\Models\Customer::whereIn('id', $allVisitedCustomerIds)
                ->where('approval_status', 'approved')
                ->select('id', 'name', 'company', 'phone', 'email', 'address', 'city', 'province')
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $customers,
                'total' => $customers->count()
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Get visited customers error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load visited customers: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}
