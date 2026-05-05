<?php

namespace App\Http\Controllers;

use App\Models\Warning;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WarningController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if warnings table exists
            if (!\Schema::hasTable('warnings')) {
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
            
            $query = Warning::with('user')->orderBy('created_at', 'desc');
            
            // Filter by user role
            if ($user->role === 'sales_manager') {
                $query->where('user_id', $user->id)
                      ->orWhereHas('user', function($q) {
                          $q->where('role', 'sales');
                      });
            } elseif ($user->role === 'sales') {
                $query->where('user_id', $user->id);
            }
            // Admin sees all warnings
            
            if ($request->status && $request->status !== 'Semua') {
                $query->where('status', $request->status);
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
                    'unread' => $warnings->where('status', 'unread')->count(),
                    'read' => $warnings->where('status', 'read')->count(),
                    'high_priority' => $warnings->where('priority', 'high')->count(),
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
            
            $query = Warning::query();
            
            if ($user->role !== 'administrator') {
                $query->where('user_id', $user->id);
            }
            
            $warning = $query->findOrFail($id);
            $warning->update(['is_read' => true, 'status' => 'read']);
            
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
            
            $query = Warning::where('is_read', false);
            
            if ($user->role !== 'administrator') {
                $query->where('user_id', $user->id);
            }
            
            $updatedCount = $query->update(['is_read' => true, 'status' => 'read']);
            
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
            
            $query = Warning::where('is_read', false);
            
            if ($user->role !== 'administrator') {
                $query->where('user_id', $user->id);
            }
            
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

    public function delete($id): JsonResponse
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
            
            $query = Warning::query();
            
            if ($user->role !== 'administrator') {
                $query->where('user_id', $user->id);
            }
            
            $total = $query->count();
            $unread = $query->where('is_read', false)->count();
            
            // Get warning type breakdown
            $typeBreakdown = Warning::selectRaw('type, COUNT(*) as count')
                ->when($user->role !== 'administrator', function($q) use ($user) {
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
}