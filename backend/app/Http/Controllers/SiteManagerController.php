<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Project;
use App\Models\Material;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteManagerController extends Controller
{
    private function normalizeIdList($value): array
    {
        if (is_array($value)) {
            return array_values(array_map('strval', $value));
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? array_values(array_map('strval', $decoded)) : [];
        }

        return [];
    }

    /**
     * Get site manager dashboard (alias for getDashboardStats)
     */
    public function dashboard(Request $request)
    {
        return $this->getDashboardStats($request);
    }

    /**
     * Get site manager dashboard statistics
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $user = $request->user();
            
            $projects = Project::where(function ($query) use ($user) {
                    $query->where('project_manager_id', $user->id);

                    if (\Illuminate\Support\Facades\Schema::hasColumn('projects', 'site_manager_id')) {
                        $query->orWhere('site_manager_id', $user->id);
                    }

                    if (\Illuminate\Support\Facades\Schema::hasColumn('projects', 'created_by')) {
                        $query->orWhere('created_by', $user->id);
                    }
                })
                ->get();

            // Project statistics
            $totalProjects = $projects->count();
            $activeProjects = $projects->whereNotIn('status', ['completed'])->count();
            $completedProjects = $projects->where('status', 'completed')->count();
            $delayedProjects = $projects->where('status', 'delayed')->count();
            $atRiskProjects = $projects->where('status', 'at_risk')->count();

            // RAB statistics
            $totalRab = $projects->sum('rab') ?? 0;
            $totalRealisasi = $projects->sum('rab_realisasi') ?? 0;
            $rabPercentage = $totalRab > 0 ? round(($totalRealisasi / $totalRab) * 100, 2) : 0;

            // Progress statistics
            $avgProgress = $projects->where('status', '!=', 'completed')->avg('progress') ?? 0;
            $avgProgress = round($avgProgress, 1);

            // Count projects from Funnel WON (name starts with [FUNNEL])
            $funnelProjects = $projects->filter(fn($p) => str_starts_with($p->name ?? '', '[FUNNEL]'));
            $pendingFunnelProjects = $funnelProjects->whereIn('status', ['on_track'])->count();

            // Recent projects (latest 5, show funnel-originated first)
            $recentProjects = $projects->sortByDesc('created_at')
                ->take(5)
                ->map(function($project) {
                    $isFunnel = str_starts_with($project->name ?? '', '[FUNNEL]');
                    return [
                        'id'            => $project->id,
                        'name'          => $project->name,
                        'status'        => $project->status,
                        'progress'      => $project->progress ?? 0,
                        'budget'        => $project->rab ?? 0,
                        'budget_realisasi' => $project->rab_realisasi ?? 0,
                        'deadline'      => $project->end_date,
                        'location'      => $project->location,
                        'pm_name'       => $project->pm_name,
                        'from_funnel'   => $isFunnel,
                        'days_remaining' => now()->diffInDays($project->end_date, false),
                        'created_at'    => $project->created_at?->format('Y-m-d'),
                    ];
                })
                ->values();

            // Project status breakdown
            $statusBreakdown = [
                'on_track'  => $projects->where('status', 'on_track')->count(),
                'at_risk'   => $projects->where('status', 'at_risk')->count(),
                'delayed'   => $projects->where('status', 'delayed')->count(),
                'completed' => $projects->where('status', 'completed')->count(),
            ];

            // Engineers list - optimized
            $projectIds = $projects->pluck('id')->toArray();
            
            $engineers = User::select('id', 'name', 'email', 'assigned_projects')
                ->where('role', 'engineer')
                ->where('is_active', true)
                ->get()
                ->map(function($engineer) use ($projectIds) {
                    $assignedProjectIds = $this->normalizeIdList($engineer->assigned_projects ?? []);
                    $relevantProjects = array_intersect($assignedProjectIds, array_map('strval', $projectIds));
                    
                    return [
                        'id' => $engineer->id,
                        'name' => $engineer->name,
                        'email' => $engineer->email,
                        'assigned_projects_count' => count($relevantProjects),
                        'active_projects' => count($relevantProjects) // Simplified - would need status check for accuracy
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'projects' => [
                        'total'             => $totalProjects,
                        'active'            => $activeProjects,
                        'completed'         => $completedProjects,
                        'delayed'           => $delayedProjects,
                        'at_risk'           => $atRiskProjects,
                        'avg_progress'      => $avgProgress,
                        'from_funnel'       => $funnelProjects->count(),
                        'pending_funnel'    => $pendingFunnelProjects,
                    ],
                    'rab' => [
                        'total'      => $totalRab,
                        'realisasi'  => $totalRealisasi,
                        'percentage' => $rabPercentage
                    ],
                    'engineers' => [
                        'total'           => User::where('role', 'engineer')->where('is_active', true)->count(),
                        'assigned'        => $engineers->where('assigned_projects_count', '>', 0)->count(),
                        'active'          => $engineers->where('active_projects', '>', 0)->count(),
                        'assigned_count'  => User::where('role', 'engineer')->where('is_active', true)->count(),
                        'total_available' => User::where('role', 'engineer')->where('is_active', true)->count()
                    ],
                    'deadlines' => [
                        'upcoming' => $projects->filter(function ($project) {
                            if (!$project->end_date || $project->status === 'completed') {
                                return false;
                            }

                            $daysRemaining = now()->diffInDays($project->end_date, false);
                            return $daysRemaining >= 0 && $daysRemaining <= 7;
                        })->count(),
                    ],
                    'status_breakdown'  => $statusBreakdown,
                    'recent_projects'   => $recentProjects,
                    'engineers_list'    => $engineers
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
     * Get projects for site manager
     */
    public function getProjects(Request $request)
    {
        try {
            $user = $request->user();
            
            $projects = Project::where('project_manager_id', $user->id)
                ->orWhere('pm_name', $user->name)
                ->with(['projectManager'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'description' => $project->description,
                        'location' => $project->location,
                        'status' => $project->status,
                        'progress' => $project->progress ?? 0,
                        'rab' => $project->rab ?? 0, // Use actual rab column
                        'rab_realisasi' => $project->rab_realisasi ?? 0, // Use actual rab_realisasi column
                        'start_date' => $project->start_date,
                        'end_date' => $project->end_date,
                        'pm_name' => $project->pm_name,
                        'pm_email' => $project->pm_email,
                        'assigned_engineers' => $this->normalizeIdList($project->assigned_engineers ?? []),
                        'created_at' => $project->created_at->format('Y-m-d H:i'),
                        'days_remaining' => now()->diffInDays($project->end_date, false)
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $projects
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load projects: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new project
     */
    public function createProject(Request $request)
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'location' => 'required|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'rab' => 'required|numeric|min:0',
                'pm_name' => 'nullable|string|max:255',
                'pm_email' => 'nullable|email'
            ]);

            $project = Project::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'location' => $validated['location'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'rab' => $validated['rab'], // Use actual rab column
                'rab_realisasi' => 0, // Use actual rab_realisasi column
                'pm_name' => $validated['pm_name'] ?? $user->name,
                'pm_email' => $validated['pm_email'] ?? $user->email,
                'project_manager_id' => $user->id,
                'status' => 'on_track',
                'progress' => 0
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'create_project',
                'description' => "Created project: {$project->name}",
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Project created successfully',
                'data' => $project
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create project: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update project
     */
    public function updateProject(Request $request, Project $project)
    {
        try {
            $user = $request->user();
            
            // Check if user owns this project
            if ($project->project_manager_id !== $user->id && $project->pm_name !== $user->name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this project'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string',
                'location' => 'sometimes|string|max:255',
                'start_date' => 'sometimes|date',
                'end_date' => 'sometimes|date|after:start_date',
                'rab' => 'sometimes|numeric|min:0', // Use actual rab column
                'rab_realisasi' => 'sometimes|numeric|min:0', // Use actual rab_realisasi column
                'progress' => 'sometimes|integer|min:0|max:100',
                'status' => 'sometimes|in:on_track,at_risk,delayed,completed'
            ]);

            $project->update($validated);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'update_project',
                'description' => "Updated project: {$project->name}",
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Project updated successfully',
                'data' => $project
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update project: ' . $e->getMessage()
            ], 500);
        }
    }
}
