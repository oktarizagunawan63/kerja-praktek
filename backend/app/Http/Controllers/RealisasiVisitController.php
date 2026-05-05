<?php

namespace App\Http\Controllers;

use App\Models\RealisasiVisit;
use App\Models\PlanVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RealisasiVisitController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Build query for completed visits (realisasi)
            $query = RealisasiVisit::with(['planVisit.customer', 'directCustomer', 'visitor'])
                ->whereIn('status', ['done', 'missed']);
            
            // Role-based filtering
            if ($user->role === 'sales') {
                // Sales only sees their own visits
                $query->where('visited_by', $user->id);
            } elseif ($user->role === 'sales_manager') {
                // Sales Manager sees all visits from their team
                $salesTeam = \App\Models\User::where('role', 'sales')
                    ->where('is_active', true)
                    ->pluck('id');
                $query->whereIn('visited_by', $salesTeam->push($user->id));
            }
            // Administrator sees all
            
            $realisasiVisits = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $realisasiVisits
            ]);
            
        } catch (\Exception $e) {
            \Log::error('RealisasiVisit index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch realisasi visits: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'plan_visit_id' => 'required|exists:plan_visits,id',
                'status' => 'required|in:done,missed',
                'visit_date' => 'nullable|date',
                'meeting_notes' => 'nullable|string',
                'visit_outcome' => 'nullable|in:closed,follow_up,not_interested,rescheduled',
                'deal_amount' => 'nullable|numeric|min:0',
                'deal_notes' => 'nullable|string',
                'hasil_visit' => 'nullable|string',
                'catatan' => 'nullable|string',
                'visited_at' => 'nullable|date',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'photos' => 'nullable|array',
                'photos.*' => 'string',
                'visited_by' => 'nullable|exists:users,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Check if plan visit exists and user has permission
            $planVisit = PlanVisit::findOrFail($request->plan_visit_id);
            $user = Auth::user();
            
            // Allow if user is assigned to the visit OR is sales_manager/administrator
            if ($user->role === 'sales' && $planVisit->assigned_to !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to complete this visit'
                ], 403);
            }
            
            // Check if realisasi already exists
            if ($planVisit->realisasiVisit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visit realisasi already exists'
                ], 422);
            }
            
            $realisasiVisit = RealisasiVisit::create([
                'plan_visit_id' => $request->plan_visit_id,
                'status' => $request->status,
                'visit_date' => $request->visit_date ?: now()->toDateString(),
                'visited_at' => $request->visited_at ?: now(),
                'meeting_notes' => $request->meeting_notes,
                'visit_outcome' => $request->visit_outcome,
                'deal_amount' => $request->deal_amount,
                'deal_notes' => $request->deal_notes,
                'hasil_visit' => $request->hasil_visit,
                'catatan' => $request->catatan,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photos' => $request->photos,
                'visited_by' => $request->visited_by ?: Auth::id(),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Visit realisasi berhasil ditambahkan',
                'data' => $realisasiVisit->load(['planVisit.customer', 'visitor'])
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('RealisasiVisit store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create visit realisasi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $realisasiVisit = RealisasiVisit::with(['planVisit.customer', 'visitor'])->findOrFail($id);
            
            // Check if user can view this realisasi visit
            $user = Auth::user();
            if ($user->role === 'sales' && $realisasiVisit->visited_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view this visit realisasi'
                ], 403);
            }
            
            return response()->json([
                'success' => true,
                'data' => $realisasiVisit
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Visit realisasi not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $realisasiVisit = RealisasiVisit::findOrFail($id);
            
            // Check if user can edit this realisasi visit
            $user = Auth::user();
            if ($user->role === 'sales' && $realisasiVisit->visited_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to edit this visit realisasi'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:done,missed',
                'visit_time' => 'required_if:status,done|date',
                'notes' => 'nullable|string',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'photos' => 'nullable|array',
                'photos.*' => 'string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $realisasiVisit->update([
                'status' => $request->status,
                'visit_time' => $request->status === 'done' ? $request->visit_time : null,
                'notes' => $request->notes,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photos' => $request->photos,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Visit realisasi berhasil diperbarui',
                'data' => $realisasiVisit->load(['planVisit.customer', 'visitor'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update visit realisasi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function markAsMissed($planVisitId)
    {
        try {
            $planVisit = PlanVisit::findOrFail($planVisitId);
            $user = Auth::user();
            
            // Check permission
            if ($user->role === 'sales' && $planVisit->assigned_to !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to mark this visit as missed'
                ], 403);
            }
            
            // Check if realisasi already exists
            if ($planVisit->realisasiVisit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visit realisasi already exists'
                ], 422);
            }
            
            $realisasiVisit = RealisasiVisit::create([
                'plan_visit_id' => $planVisitId,
                'status' => 'missed',
                'visit_time' => null,
                'notes' => 'Visit marked as missed',
                'visited_by' => Auth::id(),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Visit berhasil ditandai sebagai missed',
                'data' => $realisasiVisit->load(['planVisit.customer', 'visitor'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark visit as missed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPendingVisits()
    {
        try {
            $user = Auth::user();
            
            // Get plan visits that don't have realisasi yet (pending to be visited)
            $query = PlanVisit::with(['customer', 'assignedUser'])
                ->whereDoesntHave('realisasiVisit') // No realisasi = belum dikunjungi
                ->where('status', 'approved'); // Only approved plans
            
            // Role-based filtering
            if ($user && $user->role === 'sales') {
                $query->where('assigned_to', $user->id);
            }
            
            $pendingVisits = $query->orderBy('tanggal_visit', 'asc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $pendingVisits
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Get pending visits error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending visits: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function storeUnplanned(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                // Explicitly nullable for unplanned visits
                'plan_visit_id' => 'nullable|exists:plan_visits,id',
                // New customer data (manual input)
                'customer_name' => 'required|string|min:3',
                'customer_company' => 'required|string|min:3',
                'customer_phone' => 'required|string|min:10',
                'customer_address' => 'nullable|string',
                // Visit data
                'visit_date' => 'required|date|before_or_equal:today',
                'visit_time' => 'required',
                'visit_purpose' => 'required|string|min:10',
                'meeting_notes' => 'required|string|min:10',
                'visit_outcome' => 'required|in:closed,follow_up,not_interested,rescheduled',
                'deal_amount' => 'required_if:visit_outcome,closed|nullable|numeric|min:0',
                'deal_notes' => 'nullable|string',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'photos' => 'required|array|min:1',
                'photos.*' => 'required|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $user = Auth::user();
            
            // Determine approval status based on role
            // Sales creates pending unplanned visits that need approval
            // Sales Manager creates approved unplanned visits directly
            $approvalStatus = ($user->role === 'sales') ? 'pending' : 'approved';
            $approvedBy = ($user->role === 'sales') ? null : $user->id;
            $approvedAt = ($user->role === 'sales') ? null : now();
            
            // Create unplanned visit with new customer data
            $realisasiVisit = RealisasiVisit::create([
                'type' => 'unplanned',
                'plan_visit_id' => null, // Explicitly null for unplanned visits
                'customer_id' => null, // No existing customer
                'customer_name' => $request->customer_name,
                'customer_company' => $request->customer_company,
                'customer_phone' => $request->customer_phone,
                'customer_address' => $request->customer_address,
                'visit_date' => $request->visit_date,
                'visit_time' => $request->visit_time,
                'visit_purpose' => $request->visit_purpose,
                'meeting_notes' => $request->meeting_notes,
                'visit_outcome' => $request->visit_outcome,
                'deal_amount' => $request->visit_outcome === 'closed' ? $request->deal_amount : null,
                'deal_notes' => $request->visit_outcome === 'closed' ? $request->deal_notes : null,
                'status' => $request->visit_outcome === 'closed' ? 'done' : 'done',
                'approval_status' => $approvalStatus,
                'approved_by' => $approvedBy,
                'approved_at' => $approvedAt,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photos' => $request->photos,
                'visited_by' => $user->id,
            ]);
            
            $message = ($user->role === 'sales') 
                ? 'Unplanned visit berhasil ditambahkan dan menunggu approval' 
                : 'Unplanned visit berhasil ditambahkan';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $realisasiVisit->load(['visitor'])
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Unplanned visit store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create unplanned visit: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function approveUnplanned($id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager and administrator can approve
            if (!in_array($user->role, ['sales_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager or Administrator can approve unplanned visits'
                ], 403);
            }
            
            $realisasiVisit = RealisasiVisit::findOrFail($id);
            
            if ($realisasiVisit->type !== 'unplanned') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only unplanned visits need approval'
                ], 422);
            }
            
            if ($realisasiVisit->approval_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unplanned visit sudah di-approve atau reject'
                ], 422);
            }
            
            $realisasiVisit->update([
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => null
            ]);
            
            $realisasiVisit->load(['directCustomer', 'visitor', 'approver']);
            
            return response()->json([
                'success' => true,
                'message' => 'Unplanned visit berhasil di-approve',
                'data' => $realisasiVisit
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve unplanned visit: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function rejectUnplanned(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager and administrator can reject
            if (!in_array($user->role, ['sales_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager or Administrator can reject unplanned visits'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'rejection_reason' => 'required|string|min:10'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alasan penolakan wajib diisi (min 10 karakter)',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $realisasiVisit = RealisasiVisit::findOrFail($id);
            
            if ($realisasiVisit->type !== 'unplanned') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only unplanned visits need approval'
                ], 422);
            }
            
            if ($realisasiVisit->approval_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unplanned visit sudah di-approve atau reject'
                ], 422);
            }
            
            $realisasiVisit->update([
                'approval_status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason
            ]);
            
            $realisasiVisit->load(['directCustomer', 'visitor', 'approver']);
            
            return response()->json([
                'success' => true,
                'message' => 'Unplanned visit ditolak',
                'data' => $realisasiVisit
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject unplanned visit: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function pendingUnplanned()
    {
        try {
            $user = Auth::user();
            
            $query = RealisasiVisit::with(['directCustomer', 'visitor'])
                ->where('type', 'unplanned')
                ->where('approval_status', 'pending');
            
            // Sales users only see their own pending unplanned visits
            if ($user->role === 'sales') {
                $query->where('visited_by', $user->id);
            }
            // Sales managers and administrators see all pending unplanned visits
            
            $realisasiVisits = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $realisasiVisits,
                'total' => $realisasiVisits->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending unplanned visits: ' . $e->getMessage()
            ], 500);
        }
    }
}
