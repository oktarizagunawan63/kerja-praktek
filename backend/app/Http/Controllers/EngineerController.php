<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\EngineerProgressReport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EngineerController extends Controller
{
    /**
     * Get engineer dashboard (alias for getDashboard)
     */
    public function dashboard(Request $request)
    {
        return $this->getDashboard();
    }

    public function getDashboard()
    {
        try {
            $user = Auth::user();
            
            // Get assigned projects
            $assignedProjects = Project::whereHas('assignments', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->with(['assignments.user', 'progressReports' => function($query) use ($user) {
                $query->where('user_id', $user->id)->latest();
            }])->get();

            // Get recent progress reports
            $recentReports = EngineerProgressReport::where('user_id', $user->id)
                ->with('project')
                ->latest()
                ->take(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'assigned_projects' => $assignedProjects,
                    'recent_reports' => $recentReports,
                    'stats' => [
                        'total_projects' => $assignedProjects->count(),
                        'completed_projects' => $assignedProjects->where('progress', '>=', 100)->count(),
                        'in_progress_projects' => $assignedProjects->where('progress', '<', 100)->count(),
                        'total_reports' => EngineerProgressReport::where('user_id', $user->id)->count()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load engineer dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getMyProjects()
    {
        try {
            $userId = auth()->id();
            
            $projectIds = \DB::table('project_assignments')
                ->where('user_id', $userId)
                ->pluck('project_id');
            
            \Log::info('Engineer ' . $userId . ' assigned to projects: ' . $projectIds->toJson());
            
            if ($projectIds->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No projects assigned'
                ]);
            }
            
            $projects = Project::whereIn('id', $projectIds)
                ->whereNull('deleted_at')
                ->get()
                ->map(function($p) {
                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'location' => $p->location ?? '',
                        'progress' => $p->progress ?? 0,
                        'deadline' => $p->end_date ?? $p->deadline,
                        'status' => $p->status ?? 'on_track',
                        'rab' => $p->budget ?? $p->rab ?? 0,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $projects
            ]);
        } catch (\Exception $e) {
            \Log::error('Engineer projects error: ' . $e->getMessage());
            return response()->json([
                'success' => true, 
                'data' => [],
                'error' => $e->getMessage()
            ]);
        }
    }

    public function submitProgressReport(Request $request)
    {
        try {
            $request->validate([
                'project_id' => 'required|exists:projects,id',
                'progress_percentage' => 'required|integer|min:0|max:100',
                'notes' => 'nullable|string',
                'photo' => 'nullable|string'
            ]);

            $user = Auth::user();
            
            // Check if user is assigned to this project
            $assignment = ProjectAssignment::where('project_id', $request->project_id)
                ->where('user_id', $user->id)
                ->first();
                
            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this project'
                ], 403);
            }

            // Handle photo upload
            $photoPath = null;
            if ($request->photo) {
                $photoData = $request->photo;
                if (strpos($photoData, 'data:image') === 0) {
                    $photoData = substr($photoData, strpos($photoData, ',') + 1);
                }
                
                $photoContent = base64_decode($photoData);
                $photoName = 'progress_' . $user->id . '_' . time() . '.jpg';
                $photoPath = 'progress_photos/' . $photoName;
                
                Storage::disk('public')->put($photoPath, $photoContent);
            }

            // Create progress report
            $report = EngineerProgressReport::create([
                'project_id' => $request->project_id,
                'user_id' => $user->id,
                'progress_percentage' => $request->progress_percentage,
                'notes' => $request->notes,
                'photo' => $photoPath,
                'reported_at' => now()
            ]);

            // Update project progress (take the highest progress from all assigned engineers)
            $maxProgress = EngineerProgressReport::where('project_id', $request->project_id)
                ->max('progress_percentage');
                
            Project::where('id', $request->project_id)->update([
                'progress' => $maxProgress
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Progress report submitted successfully',
                'data' => $report->load('project')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit progress report: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getProgressReports()
    {
        try {
            $user = Auth::user();
            
            $reports = EngineerProgressReport::where('user_id', $user->id)
                ->with('project')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reports
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load progress reports: ' . $e->getMessage()
            ], 500);
        }
    }

    public function assignEngineer(Request $request)
    {
        try {
            $request->validate([
                'project_id' => 'required|exists:projects,id',
                'engineer_ids' => 'required|array',
                'engineer_ids.*' => 'exists:users,id'
            ]);

            $user = Auth::user();
            $project = Project::findOrFail($request->project_id);

            // Check if user can assign engineers (site manager or admin)
            if (!in_array($user->role, ['site_manager', 'administrator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to assign engineers'
                ], 403);
            }

            // Remove existing assignments
            ProjectAssignment::where('project_id', $request->project_id)->delete();

            // Add new assignments
            foreach ($request->engineer_ids as $engineerId) {
                ProjectAssignment::create([
                    'project_id' => $request->project_id,
                    'user_id' => $engineerId,
                    'assigned_by' => $user->id,
                    'assigned_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Engineers assigned successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign engineers: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAvailableEngineers()
    {
        try {
            $engineers = User::where('role', 'engineer')
                ->where('is_active', true)
                ->select('id', 'name', 'email')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $engineers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load engineers: ' . $e->getMessage()
            ], 500);
        }
    }
}