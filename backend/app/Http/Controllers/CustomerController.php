<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = Customer::with('creator');
            
            // Role-based access control
            switch ($user->role) {
                case 'administrator':
                case 'admin':
                case 'sales_manager':
                    // Admin and Sales Manager see ALL customers
                    break;
                    
                case 'sales':
                    // Sales see ALL customers (read only, no create/edit/delete)
                    break;
                    
                default:
                    // Other roles have no access to customers
                    return response()->json([
                        'success' => false,
                        'message' => 'Tidak memiliki akses ke data customer'
                    ], 403);
            }
            
            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('company', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            }
            
            $customers = $query->orderBy('created_at', 'desc')->get();
            
            // Add visit statistics to each customer
            $customers->each(function($customer) {
                $customer->visit_stats = $customer->visit_stats;
            });
            
            return response()->json([
                'success' => true,
                'data' => $customers
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customers: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Sales Manager, Admin, and Sales can create customers
            if (!in_array($user->role, ['sales_manager', 'sales', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk membuat customer'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'company' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'required|string',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Sales Manager creates approved customers directly
            // Sales creates pending customers that need approval
            $approvalStatus = ($user->role === 'sales') ? 'pending' : 'approved';
            $approvedBy = ($user->role === 'sales') ? null : $user->id;
            $approvedAt = ($user->role === 'sales') ? null : now();
            
            $customer = Customer::create([
                'name' => $request->name,
                'company' => $request->company,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'created_by' => Auth::id() ?? 1,
                'approval_status' => $approvalStatus,
                'approved_by' => $approvedBy,
                'approved_at' => $approvedAt,
            ]);
            
            // Load the creator relationship
            $customer->load('creator');
            
            $message = ($user->role === 'sales') 
                ? 'Customer berhasil ditambahkan dan menunggu approval' 
                : 'Customer berhasil ditambahkan';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $customer
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $customer = Customer::with(['creator', 'planVisits.assignedUser', 'completedVisits'])
                               ->findOrFail($id);
            
            // Add visit statistics
            $customer->visit_stats = $customer->visit_stats;
            
            return response()->json([
                'success' => true,
                'data' => $customer
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager and admin can edit customers
            if (!in_array($user->role, ['sales_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager and Admin can edit customers'
                ], 403);
            }
            
            $customer = Customer::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'company' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'required|string',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $customer->update([
                'name' => $request->name,
                'company' => $request->company,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ]);
            
            $customer->load('creator');
            
            return response()->json([
                'success' => true,
                'message' => 'Customer berhasil diperbarui',
                'data' => $customer
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager and admin can delete customers
            if (!in_array($user->role, ['sales_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager and Admin can delete customers'
                ], 403);
            }
            
            $customer = Customer::findOrFail($id);
            
            // Delete related plan visits first
            if ($customer->planVisits()->count() > 0) {
                // Get all plan visit IDs
                $planVisitIds = $customer->planVisits()->pluck('id');
                
                // Delete related realisasi visits first
                \DB::table('realisasi_visits')
                    ->whereIn('plan_visit_id', $planVisitIds)
                    ->delete();
                
                // Then delete plan visits
                $customer->planVisits()->delete();
            }
            
            // Now delete the customer
            $customer->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Customer berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function approve($id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager and administrator can approve
            if (!in_array($user->role, ['sales_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager or Administrator can approve customers'
                ], 403);
            }
            
            $customer = Customer::findOrFail($id);
            
            if ($customer->approval_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer sudah di-approve atau reject'
                ], 422);
            }
            
            $customer->update([
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => null
            ]);
            
            $customer->load(['creator', 'approver']);
            
            return response()->json([
                'success' => true,
                'message' => 'Customer berhasil di-approve',
                'data' => $customer
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve customer: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function reject(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager and administrator can reject
            if (!in_array($user->role, ['sales_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager or Administrator can reject customers'
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
            
            $customer = Customer::findOrFail($id);
            
            if ($customer->approval_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer sudah di-approve atau reject'
                ], 422);
            }
            
            $customer->update([
                'approval_status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason
            ]);
            
            $customer->load(['creator', 'approver']);
            
            return response()->json([
                'success' => true,
                'message' => 'Customer ditolak',
                'data' => $customer
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject customer: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function pending()
    {
        try {
            $user = Auth::user();
            
            // Only sales_manager can see pending customers
            if ($user->role !== 'sales_manager') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Sales Manager can view pending customers'
                ], 403);
            }
            
            $customers = Customer::with(['creator'])
                ->where('approval_status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $customers,
                'total' => $customers->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending customers: ' . $e->getMessage()
            ], 500);
        }
    }

}
