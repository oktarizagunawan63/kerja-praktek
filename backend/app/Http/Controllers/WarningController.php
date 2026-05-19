<?php

namespace App\Http\Controllers;

use App\Models\Warning;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class WarningController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if warnings table exists
            if (!Schema::hasTable('warnings')) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'summary' => [
                        'total' => 0,
                        'unread' => 0,
                        'read' => 0,
                        'high_priority' => 0,
                    ]
                ]);
            }
            
            $user = $request->user();
            
            $query = Warning::with(['user', 'planVisit.customer'])->orderBy('created_at', 'desc');
            
            // Filter by user role
            if ($user->role === 'sales_manager') {
                $query->where(function ($roleQuery) use ($user) {
                    $roleQuery->where('user_id', $user->id)
                        ->orWhereHas('user', function($q) {
                            $q->where('role', 'sales');
                        });
                });
            } elseif ($user->role === 'sales') {
                $query->where('user_id', $user->id);
            }
            // Admin sees all warnings
            
            if ($request->status && !in_array($request->status, ['all', 'Semua'], true)) {
                if ($request->status === 'unread') {
                    $query->where('is_read', false);
                } elseif ($request->status === 'read') {
                    $query->where('is_read', true);
                }
            }
            
            if ($request->start_date) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            
            if ($request->end_date) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }
            
            $warnings = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $warnings,
                'summary' => [
                    'total' => $warnings->count(),
                    'unread' => $warnings->where('is_read', false)->count(),
                    'read' => $warnings->where('is_read', true)->count(),
                    'high_priority' => Schema::hasColumn('warnings', 'priority') ? $warnings->where('priority', 'high')->count() : 0,
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Warning index error: ' . $e->getMessage());
            return response()->json([
                'success' => true, 
                'data' => [], 
                'summary' => [
                    'total' => 0,
                    'unread' => 0,
                    'read' => 0,
                    'high_priority' => 0,
                ]
            ]);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $user = request()->user();
            
            $query = Warning::with(['user', 'planVisit.customer']);
            
            if ($user->role !== 'administrator') {
                $query->where('user_id', $user->id);
            }
            
            $warning = $query->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $warning->id,
                    'type' => $warning->type,
                    'title' => $warning->title,
                    'message' => $warning->message,
                    'user_id' => $warning->user_id,
                    'user_name' => $warning->user->name ?? 'Unknown',
                    'plan_visit_id' => $warning->plan_visit_id,
                    'customer_name' => $warning->planVisit->customer->name ?? null,
                    'is_read' => $warning->is_read,
                    'created_at' => $warning->created_at->toISOString(),
                    'updated_at' => $warning->updated_at->toISOString()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Warning not found: ' . $e->getMessage()
            ], 404);
        }
    }

    public function markAsRead($id): JsonResponse
    {
        try {
            $user = request()->user();
            
            $query = $this->queryVisibleWarnings($user);
            
            $warning = $query->findOrFail($id);
            $warning->markAsRead();
            
            return response()->json([
                'success' => true,
                'message' => 'Warning marked as read'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark warning as read: ' . $e->getMessage()
            ], 500);
        }
    }

    public function markAllAsRead(): JsonResponse
    {
        try {
            $user = request()->user();
            
            $query = $this->queryVisibleWarnings($user)->where('is_read', false);
            
            $data = ['is_read' => true];
            if (Schema::hasColumn('warnings', 'status')) {
                $data['status'] = 'read';
            }

            $updatedCount = $query->update($data);
            
            return response()->json([
                'success' => true,
                'message' => "Marked $updatedCount warnings as read"
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all warnings as read: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getUnreadCount(): JsonResponse
    {
        try {
            $user = request()->user();
            
            $query = $this->queryVisibleWarnings($user)->where('is_read', false);
            
            $count = $query->count();
            
            return response()->json([
                'success' => true,
                'data' => $count
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get unread count: ' . $e->getMessage(),
                'data' => 0
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!in_array($user->role, ['administrator', 'sales_manager'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to create warnings'
                ], 403);
            }

            $data = $request->validate([
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'nullable|string|max:100',
                'priority' => 'nullable|in:low,medium,high',
                'plan_visit_id' => 'nullable|exists:plan_visits,id',
            ]);

            $payload = [
                'user_id' => $data['user_id'],
                'title' => $data['title'],
                'message' => $data['message'],
                'type' => $data['type'] ?? 'manual',
                'plan_visit_id' => $data['plan_visit_id'] ?? null,
                'is_read' => false,
            ];

            if (Schema::hasColumn('warnings', 'priority')) {
                $payload['priority'] = $data['priority'] ?? 'medium';
            }

            if (Schema::hasColumn('warnings', 'status')) {
                $payload['status'] = 'unread';
            }

            $warning = Warning::create($payload);

            return response()->json([
                'success' => true,
                'message' => 'Warning created successfully',
                'data' => $warning->load(['user', 'planVisit.customer'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create warning: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $warning = $this->queryVisibleWarnings($user)->findOrFail($id);

            $data = $request->validate([
                'is_read' => 'nullable|boolean',
                'status' => 'nullable|in:unread,read',
                'priority' => 'nullable|in:low,medium,high',
                'title' => 'nullable|string|max:255',
                'message' => 'nullable|string',
            ]);

            if (array_key_exists('is_read', $data)) {
                if (Schema::hasColumn('warnings', 'status')) {
                    $data['status'] = $data['is_read'] ? 'read' : 'unread';
                }
            } elseif (isset($data['status'])) {
                $data['is_read'] = $data['status'] === 'read';
            }

            if (!Schema::hasColumn('warnings', 'status')) {
                unset($data['status']);
            }

            if (!Schema::hasColumn('warnings', 'priority')) {
                unset($data['priority']);
            }

            $warning->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Warning updated successfully',
                'data' => $warning->fresh()->load(['user', 'planVisit.customer'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update warning: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $user = request()->user();
            
            // Only admin can delete warnings
            if ($user->role !== 'administrator') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete warnings'
                ], 403);
            }
            
            $warning = Warning::findOrFail($id);
            $warning->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Warning deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete warning: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getWarningStats(): JsonResponse
    {
        try {
            $user = request()->user();
            
            $query = $this->queryVisibleWarnings($user);
            
            $total = $query->count();
            $unread = (clone $query)->where('is_read', false)->count();
            
            // Get warning type breakdown
            $typeBreakdown = Warning::selectRaw('type, COUNT(*) as count')
                ->when($user->role === 'sales_manager', function($q) use ($user) {
                    return $q->where(function ($roleQuery) use ($user) {
                        $roleQuery->where('user_id', $user->id)
                            ->orWhereHas('user', fn($userQuery) => $userQuery->where('role', 'sales'));
                    });
                })
                ->when($user->role === 'sales', function($q) use ($user) {
                    return $q->where('user_id', $user->id);
                })
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'unread' => $unread,
                    'type_breakdown' => $typeBreakdown
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get warning stats: ' . $e->getMessage(),
                'data' => [
                    'total' => 0,
                    'unread' => 0,
                    'type_breakdown' => []
                ]
            ], 500);
        }
    }

    private function queryVisibleWarnings($user)
    {
        $query = Warning::query();

        if ($user->role === 'administrator') {
            return $query;
        }

        if ($user->role === 'sales_manager') {
            return $query->where(function ($roleQuery) use ($user) {
                $roleQuery->where('user_id', $user->id)
                    ->orWhereHas('user', fn($userQuery) => $userQuery->where('role', 'sales'));
            });
        }

        return $query->where('user_id', $user->id);
    }
}
