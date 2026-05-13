<?php

namespace App\Http\Controllers;

use App\Models\PlanVisit;
use App\Models\RealisasiVisit;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PlanVisitController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            $query = PlanVisit::with(['customer', 'assignedUser', 'creator', 'realisasiVisit'])
                // EXCLUDE plan visits that already have completed realisasi (status = done)
                ->whereDoesntHave('realisasiVisit', function($q) {
                    $q->where('status', 'done');
                })
                ->orderBy('tanggal_visit', 'desc');
            
            // All roles can see all plan visits (no filtering by role)
            // Sales and engineer can only view, not edit/delete (handled in update/destroy methods)
            
            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('lokasi', 'like', "%{$search}%")
                      ->orWhere('tujuan', 'like', "%{$search}%")
                      ->orWhere('catatan', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('name', 'like', "%{$search}%")
                                       ->orWhere('company', 'like', "%{$search}%");
                      });
                });
            }
            
            // Filter by status if provided
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            
            // Filter by date range if provided
            if ($request->has('start_date') && !empty($request->start_date)) {
                $query->where('tanggal_visit', '>=', $request->start_date);
            }
            if ($request->has('end_date') && !empty($request->end_date)) {
                $query->where('tanggal_visit', '<=', $request->end_date);
            }
            
            $planVisits = $query->get();
            
            \Log::info('PlanVisit index - User: ' . $user->email . ' (Role: ' . $user->role . '), Results: ' . $planVisits->count());
            
            return response()->json([
                'success' => true,
                'data' => $planVisits
            ]);
            
        } catch (\Exception $e) {
            \Log::error('PlanVisit index error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch plan visits: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function approved(Request $request)
    {
        try {
            // Get user
            $user = $request->user();
            
            // Build query - use DB query builder to avoid model accessor issues
            $query = \DB::table('plan_visits')
                ->leftJoin('customers', 'plan_visits.customer_id', '=', 'customers.id')
                ->leftJoin('users', 'plan_visits.assigned_to', '=', 'users.id')
                ->leftJoin('realisasi_visits', 'plan_visits.id', '=', 'realisasi_visits.plan_visit_id')
                ->select(
                    'plan_visits.*',
                    'customers.name as customer_name',
                    'customers.company as customer_company',
                    'customers.phone as customer_phone',
                    'customers.email as customer_email',
                    'customers.address as customer_address',
                    'users.name as assigned_user_name',
                    'users.email as assigned_user_email'
                )
                ->where('plan_visits.status', 'approved')
                ->whereNull('realisasi_visits.id') // Only plans without realisasi
                ->orderBy('plan_visits.tanggal_visit', 'desc');

            // Filter by assigned user for sales role
            if ($user && in_array($user->role, ['sales'])) {
                $query->where('plan_visits.assigned_to', $user->id);
            }

            $planVisits = $query->get();
            
            // Format response
            $formatted = $planVisits->map(function($visit) {
                return [
                    'id' => $visit->id,
                    'customer_id' => $visit->customer_id,
                    'assigned_to' => $visit->assigned_to,
                    'tanggal_visit' => $visit->tanggal_visit,
                    'waktu_visit' => $visit->waktu_visit,
                    'lokasi' => $visit->lokasi,
                    'tujuan' => $visit->tujuan,
                    'catatan' => $visit->catatan,
                    'status' => $visit->status,
                    'customer' => [
                        'id' => $visit->customer_id,
                        'name' => $visit->customer_name,
                        'company' => $visit->customer_company,
                        'phone' => $visit->customer_phone,
                        'email' => $visit->customer_email,
                        'address' => $visit->customer_address,
                    ],
                    'assignedUser' => [
                        'name' => $visit->assigned_user_name,
                        'email' => $visit->assigned_user_email,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formatted,
                'total' => $formatted->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in approved plan visits: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approved plan visits: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }


    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Block Site Manager and Engineer from creating plan visits
            if (in_array($user->role, ['site_manager', 'engineer'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Visit tracking bukan urusan role Anda.'
                ], 403);
            }
            
            \Log::info('PlanVisit store request data:', $request->all());
            
            $validator = Validator::make($request->all(), [
                'customer_id' => 'required|exists:customers,id',
                'assigned_to' => 'nullable|exists:users,id',
                'tanggal_visit' => 'nullable|date', // Changed from required to nullable
                'waktu_visit' => 'nullable|string',
                'lokasi' => 'required|string|max:500',
                'tujuan' => 'required|string|max:500',
                'catatan' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                \Log::error('PlanVisit validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            
            // Auto-assign to current user if not specified and user is sales
            $assignedTo = $request->assigned_to;
            if (!$assignedTo && in_array($user->role, ['sales', 'sales_manager'])) {
                $assignedTo = $user->id;
            }
            
            // Verify assigned user exists and has correct role
            if ($assignedTo) {
                $assignedUser = User::find($assignedTo);
                if (!$assignedUser || !in_array($assignedUser->role, ['sales', 'sales_manager'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Assigned user must be sales or sales manager'
                    ], 422);
                }
            }

            // Both Sales and Sales Manager create approved plans directly (no approval needed)
            $status = 'approved';
            $approvedBy = $user->id;
            $approvedAt = now();

            $planVisit = PlanVisit::create([
                'customer_id' => $request->customer_id,
                'assigned_to' => $assignedTo,
                'tanggal_visit' => $request->tanggal_visit,
                'waktu_visit' => $request->waktu_visit,
                'lokasi' => $request->lokasi,
                'tujuan' => $request->tujuan,
                'catatan' => $request->catatan,
                'status' => $status,
                'created_by' => $user->id,
                'approved_by' => $approvedBy,
                'approved_at' => $approvedAt,
            ]);

            \Log::info('PlanVisit created successfully:', ['id' => $planVisit->id]);

            return response()->json([
                'success' => true,
                'message' => 'Plan visit berhasil ditambahkan',
                'data' => $planVisit->load(['customer', 'assignedToUser'])
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('PlanVisit store error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create plan visit: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $planVisit = PlanVisit::with(['customer', 'assignedUser', 'creator'])->find($id);
            
            if (!$planVisit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plan visit not found'
                ], 404);
            }
            
            // All roles can view plan visits
            
            return response()->json([
                'success' => true,
                'data' => $planVisit
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch plan visit: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Sales and engineer cannot update
            if (in_array($user->role, ['sales', 'engineer'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk mengubah data plan visit'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'customer_id' => 'sometimes|exists:customers,id',
                'assigned_to' => 'sometimes|exists:users,id',
                'tanggal_visit' => 'sometimes|date',
                'waktu_visit' => 'sometimes|string',
                'lokasi' => 'sometimes|string|max:500',
                'tujuan' => 'sometimes|string|max:500',
                'catatan' => 'nullable|string|max:1000',
                'status' => 'sometimes|in:pending,approved,rejected',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $planVisit = PlanVisit::find($id);
            
            if (!$planVisit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plan visit not found'
                ], 404);
            }
            
            $planVisit->update($request->only([
                'customer_id', 'assigned_to', 'tanggal_visit', 'waktu_visit', 'lokasi', 'tujuan', 'catatan', 'status'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Plan visit berhasil diperbarui',
                'data' => $planVisit->load(['customer', 'assignedUser', 'creator'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update plan visit: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $planVisit = PlanVisit::with('realisasiVisit')->find($id);
            
            if (!$planVisit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plan visit not found'
                ], 404);
            }
            
            // Permission check: Sales and Engineer CANNOT delete
            if (in_array($user->role, ['sales', 'engineer'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk menghapus data plan visit'
                ], 403);
            }
            
            // Delete related realisasi visit first if exists
            if ($planVisit->realisasiVisit) {
                $planVisit->realisasiVisit->delete();
            }
            
            // Then delete the plan visit
            $planVisit->delete();

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'plan_visit_deleted',
                'description' => "Deleted plan visit for customer: " . ($planVisit->customer->name ?? 'Unknown'),
                'ip_address' => request()->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plan visit berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Plan visit delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete plan visit: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSalesUsers()
    {
        try {
            $salesUsers = User::where('role', 'sales')
                             ->orWhere('role', 'sales_manager')
                             ->where('is_active', true)
                             ->select('id', 'name', 'email', 'role')
                             ->orderBy('name')
                             ->get();

            return response()->json([
                'success' => true,
                'data' => $salesUsers
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales users: ' . $e->getMessage()
            ], 500);
        }
    }

    public function complete(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'hasil_visit' => 'required|string|max:1000',
                'completion_photo' => 'nullable|string', // base64 image
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $planVisit = PlanVisit::findOrFail($id);
            
            // Check if user can complete this visit
            if ($user->role === 'sales' && $planVisit->assigned_to !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to complete this visit'
                ], 403);
            }
            
            // Check if already completed
            if ($planVisit->realisasiVisit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visit already completed'
                ], 422);
            }

            // Handle photo upload if provided
            $photoPath = null;
            if ($request->completion_photo) {
                // Save base64 image (simplified for now)
                $photoPath = 'visit_photos/' . $id . '_' . time() . '.jpg';
                // In real implementation, decode and save the base64 image
            }

            // Create realisasi visit
            $realisasiVisit = RealisasiVisit::create([
                'plan_visit_id' => $planVisit->id,
                'status' => 'done',
                'visit_time' => now(),
                'notes' => $request->hasil_visit,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photos' => $photoPath ? [$photoPath] : null,
                'visited_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Visit berhasil diselesaikan',
                'data' => $realisasiVisit->load(['planVisit.customer', 'visitor'])
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Complete visit error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete visit: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function approvePlan($id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager can approve
            if ($user->role !== 'sales_manager') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager can approve plan visits'
                ], 403);
            }
            
            $planVisit = PlanVisit::findOrFail($id);
            
            if ($planVisit->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Plan visit sudah di-approve atau reject'
                ], 422);
            }
            
            $planVisit->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => null
            ]);
            
            $planVisit->load(['customer', 'assignedToUser', 'creator', 'approver']);
            
            return response()->json([
                'success' => true,
                'message' => 'Plan visit berhasil di-approve',
                'data' => $planVisit
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve plan visit: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function rejectPlan(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager can reject
            if ($user->role !== 'sales_manager') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager can reject plan visits'
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
            
            $planVisit = PlanVisit::findOrFail($id);
            
            if ($planVisit->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Plan visit sudah di-approve atau reject'
                ], 422);
            }
            
            $planVisit->update([
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason
            ]);
            
            $planVisit->load(['customer', 'assignedToUser', 'creator', 'approver']);
            
            return response()->json([
                'success' => true,
                'message' => 'Plan visit ditolak',
                'data' => $planVisit
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject plan visit: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function pendingPlans()
    {
        try {
            $user = Auth::user();
            
            $query = PlanVisit::with(['customer', 'assignedToUser', 'creator'])
                ->where('status', 'pending');
            
            // Sales users only see their own pending plans
            if ($user->role === 'sales') {
                $query->where('assigned_to', $user->id);
            }
            // Sales managers and administrators see all pending plans
            
            $planVisits = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $planVisits,
                'total' => $planVisits->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending plan visits: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get completed plan visits (riwayat)
     * Returns plan visits that have realisasi with status = done
     */
    public function completedVisits(Request $request)
    {
        try {
            $user = Auth::user();
            
            $query = PlanVisit::with(['customer', 'assignedUser', 'creator', 'realisasiVisit'])
                ->whereHas('realisasiVisit', function($q) {
                    $q->where('status', 'done')
                      ->where('type', 'planned'); // Only planned visits, not unplanned
                })
                ->orderBy('updated_at', 'desc');
            
            // Role-based filtering
            switch ($user->role) {
                case 'administrator':
                case 'admin':
                    // Admin sees ALL completed visits
                    break;
                    
                case 'sales_manager':
                    // Sales manager sees completed visits they created
                    $query->where('created_by', $user->id);
                    break;
                    
                case 'sales':
                    // Sales sees only their own completed visits
                    $query->where('assigned_to', $user->id);
                    break;
                    
            }
            
            $completedVisits = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $completedVisits,
                'total' => $completedVisits->count()
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Completed visits error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch completed visits: ' . $e->getMessage()
            ], 500);
        }
    }

}
