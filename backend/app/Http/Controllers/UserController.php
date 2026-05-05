<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::query();
        
        // Role-based filtering
        if ($user->role === 'site_manager') {
            // Site managers can only see engineers for assignment
            $query->where('role', 'engineer');
        }
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by role if provided (and user has permission)
        if ($request->has('role') && $user->role === 'administrator') {
            $query->where('role', $request->role);
        }
        
        // Try to select assigned_projects, but handle gracefully if column doesn't exist
        try {
            return response()->json(
                $query->select('id', 'name', 'email', 'role', 'is_active', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'assigned_projects', 'created_at')
                    ->with('approver:id,name')
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(fn($u) => $this->format($u))
            );
        } catch (\Exception $e) {
            // Fallback without assigned_projects column
            return response()->json(
                $query->select('id', 'name', 'email', 'role', 'is_active', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'created_at')
                    ->with('approver:id,name')
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(fn($u) => $this->format($u))
            );
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:administrator,admin,sales_manager,sales,site_manager,engineer',
            'division' => 'nullable|in:sales,engineering',
        ]);

        // Normalize role to standard format
        $roleMap = [
            'admin' => 'administrator',
            'administrator' => 'administrator',
            'sales_manager' => 'sales_manager',
            'sales' => 'sales',
            'site_manager' => 'site_manager',
            'engineer' => 'engineer'
        ];
        
        $normalizedRole = $roleMap[$data['role']] ?? strtolower($data['role']);

        // Validate division-role hierarchy (skip for administrator)
        if (!in_array($normalizedRole, ['administrator', 'admin'])) {
            if ($data['division'] === 'sales' && !in_array($normalizedRole, ['sales_manager', 'sales'])) {
                return response()->json(['message' => 'Divisi Sales hanya bisa memiliki role Sales Manager atau Sales'], 422);
            }
            
            if ($data['division'] === 'engineering' && !in_array($normalizedRole, ['site_manager', 'engineer'])) {
                return response()->json(['message' => 'Divisi Engineering hanya bisa memiliki role Site Manager atau Engineer'], 422);
            }
        }

        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => Hash::make($data['password']),
            'role'              => $normalizedRole, // Use normalized role
            'division'          => $data['division'] ?? (in_array($normalizedRole, ['administrator', 'admin']) ? null : 'engineering'),
            'is_active'         => true,
            'status'            => 'approved', // Direct approval for manual creation
            'assigned_projects' => [], // Empty array for new users
        ]);

        // Send welcome notification
        NotificationHelper::newUserCreated($user);

        return response()->json($this->format($user), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'role'      => 'sometimes|in:administrator,admin,site_manager,sales_manager,sales,engineer',
            'is_active' => 'sometimes|boolean',
            'password'  => 'sometimes|string|min:6',
            'assigned_projects' => 'sometimes|array',
        ]);

        if (isset($data['password'])) $data['password'] = Hash::make($data['password']);
        
        // Normalize role if provided
        if (isset($data['role'])) {
            $roleMap = [
                'admin' => 'administrator',
                'administrator' => 'administrator',
                'sales_manager' => 'sales_manager',
                'sales' => 'sales',
                'site_manager' => 'site_manager',
                'engineer' => 'engineer'
            ];
            $data['role'] = $roleMap[$data['role']] ?? strtolower($data['role']);
        }

        $user->update($data);
        return response()->json($this->format($user->fresh()));
    }

    public function destroy(User $user)
    {
        $currentUser = request()->user();
        
        // Check permissions
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Prevent deleting administrator accounts
        if (in_array($user->role, ['administrator'])) {
            return response()->json(['message' => 'Akun administrator tidak bisa dihapus'], 403);
        }
        
        // Only administrator can delete users, or sales_manager can delete sales/engineers
        if ($currentUser->role === 'sales_manager' && !in_array($user->role, ['engineer', 'sales'])) {
            return response()->json(['message' => 'Sales manager hanya bisa menghapus engineer dan sales'], 403);
        }
        
        if (!in_array($currentUser->role, ['administrator', 'sales_manager', 'site_manager'])) {
            return response()->json(['message' => 'Tidak memiliki izin untuk menghapus user'], 403);
        }
        
        // Prevent self-deletion
        if ($user->id === $currentUser->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri'], 403);
        }

        try {
            \DB::beginTransaction();

            $userName = $user->name;

            // Handle foreign key constraints by updating/deleting related records
            
            // 1. Update customers created_by to null or reassign to current user
            \DB::table('customers')
                ->where('created_by', $user->id)
                ->update(['created_by' => $currentUser->id]);

            // 2. Update plan_visits assigned_to and created_by
            \DB::table('plan_visits')
                ->where('assigned_to', $user->id)
                ->update(['assigned_to' => null]);
            
            \DB::table('plan_visits')
                ->where('created_by', $user->id)
                ->update(['created_by' => $currentUser->id]);

            // 3. Update realisasi_visits visited_by
            \DB::table('realisasi_visits')
                ->where('visited_by', $user->id)
                ->update(['visited_by' => null]);

            // 4. Delete attendance records (safe to delete)
            \DB::table('attendance')
                ->where('user_id', $user->id)
                ->delete();

            // 5. Delete warnings for this user
            \DB::table('warnings')
                ->where('user_id', $user->id)
                ->delete();

            // 6. Update users approved_by (self-referencing)
            \DB::table('users')
                ->where('approved_by', $user->id)
                ->update(['approved_by' => null]);

            // 7. Handle projects - reassign to current user if they are project manager or creator
            \DB::table('projects')
                ->where('project_manager_id', $user->id)
                ->update(['project_manager_id' => $currentUser->id]);
            
            \DB::table('projects')
                ->where('created_by', $user->id)
                ->update(['created_by' => $currentUser->id]);

            // 8. Activity logs, progress reports, and documents will cascade delete automatically

            // Now safe to delete the user
            $user->delete();
            
            // Log the deletion
            \App\Models\ActivityLog::create([
                'user_id'    => $currentUser->id,
                'action'     => 'delete_user',
                'description'=> "Menghapus user {$userName} dan memindahkan data terkait",
                'ip_address' => request()->ip(),
            ]);

            \DB::commit();
            
            return response()->json(['message' => "User {$userName} berhasil dihapus dan data terkait telah dipindahkan"]);

        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal menghapus user: ' . $e->getMessage()], 500);
        }
    }

    public function approveUser(Request $request, User $user)
    {
        // Check permission: administrator can approve all, sales_manager can approve engineers only
        $currentUser = $request->user();
        
        if ($currentUser->role === 'sales_manager' && !in_array($user->role, ['engineer', 'sales'])) {
            return response()->json(['message' => 'Sales manager hanya bisa menyetujui engineer dan sales'], 403);
        }
        
        if (!in_array($currentUser->role, ['administrator', 'sales_manager', 'site_manager'])) {
            return response()->json(['message' => 'Tidak memiliki izin untuk menyetujui user'], 403);
        }

        $user->update([
            'status'      => 'approved',
            'is_active'   => true,
            'approved_by' => $currentUser->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        // Create welcome notification for the approved user
        try {
            \App\Models\ProjectNotification::create([
                'project_id' => null,
                'user_id' => $user->id,
                'title' => 'Selamat Datang di PT Amsar!',
                'message' => "Halo {$user->name}! Akun Anda telah disetujui dan sekarang aktif. Selamat bergabung dengan tim PT Amsar.",
                'type' => 'welcome',
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the approval process
            \Log::error('Failed to create welcome notification: ' . $e->getMessage());
        }

        ActivityLog::create([
            'user_id'    => $currentUser->id,
            'action'     => 'approve_user',
            'description'=> "Menyetujui registrasi {$user->name} ({$user->role})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'User berhasil disetujui',
            'user' => $this->format($user->fresh())
        ]);
    }

    public function rejectUser(Request $request, User $user)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        // Check permission: administrator can reject all, sales_manager can reject engineers only
        $currentUser = $request->user();
        
        if ($currentUser->role === 'sales_manager' && !in_array($user->role, ['engineer', 'sales'])) {
            return response()->json(['message' => 'Sales manager hanya bisa menolak engineer dan sales'], 403);
        }
        
        if (!in_array($currentUser->role, ['administrator', 'sales_manager', 'site_manager'])) {
            return response()->json(['message' => 'Tidak memiliki izin untuk menolak user'], 403);
        }

        $user->update([
            'status'           => 'rejected',
            'is_active'        => false,
            'approved_by'      => $currentUser->id,
            'approved_at'      => now(),
            'rejection_reason' => $request->reason,
        ]);

        ActivityLog::create([
            'user_id'    => $currentUser->id,
            'action'     => 'reject_user',
            'description'=> "Menolak registrasi {$user->name} ({$user->role}) - {$request->reason}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'User berhasil ditolak',
            'user' => $this->format($user->fresh())
        ]);
    }

    public function assignProject(Request $request, User $user)
    {
        $request->validate(['project_id' => 'required|string']);
        $projectId = (string)$request->project_id;
        
        // Get current assigned projects
        $assignedProjects = $user->assigned_projects ?? [];
        if (!is_array($assignedProjects)) {
            $assignedProjects = [];
        }

        // Toggle assignment
        if (in_array($projectId, $assignedProjects)) {
            $assignedProjects = array_values(array_filter($assignedProjects, fn($p) => $p !== $projectId));
        } else {
            $assignedProjects[] = $projectId;
        }

        // Update user
        $user->update(['assigned_projects' => array_unique($assignedProjects)]);
        
        return response()->json($this->format($user->fresh()));
    }

    private function format(User $u): array
    {
        // Safely handle assigned_projects - try both column and project_assignments table
        $assignedProjects = [];
        try {
            // First try to get from assigned_projects column
            if (isset($u->assigned_projects)) {
                $assignedProjects = $u->assigned_projects;
                if (is_string($assignedProjects)) {
                    $assignedProjects = json_decode($assignedProjects, true) ?: [];
                }
                if (!is_array($assignedProjects)) {
                    $assignedProjects = [];
                }
            } else {
                // Fallback to project_assignments table
                $assignedProjects = \DB::table('project_assignments')
                    ->where('user_id', $u->id)
                    ->pluck('project_id')
                    ->map(fn($id) => (string)$id)
                    ->toArray();
            }
        } catch (\Exception $e) {
            // Both methods failed, use empty array
            $assignedProjects = [];
        }

        return [
            'id'                => $u->id,
            'name'              => $u->name,
            'email'             => $u->email,
            'role'              => $u->role,
            'division'          => $u->division,
            'is_active'         => (bool)$u->is_active,
            'status'            => $u->status ?? 'approved',
            'approved_by'       => $u->approved_by,
            'approved_at'       => $u->approved_at,
            'rejection_reason'  => $u->rejection_reason,
            'approver'          => $u->approver ? $u->approver->name : null,
            'assignedProjects'  => $assignedProjects,
            'created_at'        => $u->created_at,
        ];
    }

    public function getEngineers()
    {
        try {
            // FIX 4: Get engineers with normalized roles
            $engineers = User::where('role', 'engineer') // Exact match after normalization
                ->where('is_active', true)
                ->select('id', 'name', 'email', 'role', 'is_active')
                ->get();

            \Log::info('Engineers found', [
                'count' => $engineers->count(),
                'engineers' => $engineers->toArray()
            ]);

            // FIX 4: Simple response format that frontend expects
            return response()->json([
                'success' => true,
                'data' => $engineers,
                'total' => $engineers->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in getEngineers: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch engineers: ' . $e->getMessage(),
                'data' => [],
                'total' => 0
            ], 500);
        }
    }

    // FIX 7: Get sales users for Plan Visit assignment
    public function getSalesUsers()
    {
        try {
            $salesUsers = User::whereIn('role', ['sales', 'sales_manager'])
                ->where('is_active', true)
                ->select('id', 'name', 'email', 'role')
                ->orderBy('role', 'desc') // sales_manager first
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $salesUsers,
                'total' => $salesUsers->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in getSalesUsers: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales users: ' . $e->getMessage(),
                'data' => [],
                'total' => 0
            ], 500);
        }
    }
}
