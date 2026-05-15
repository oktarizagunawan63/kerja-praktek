<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\EngineerProgressReport;
use App\Models\Material;
use App\Models\Document;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
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

            $formattedProjects = $assignedProjects->map(function ($project) use ($user) {
                $engineerReports = $project->progressReports
                    ->where('user_id', $user->id)
                    ->values()
                    ->map(function ($report) {
                        return [
                            'id' => $report->id,
                            'progress_percentage' => $report->progress_percentage,
                            'notes' => $report->notes,
                            'photo' => $report->photo,
                            'material_updates' => $report->material_updates ?? [],
                            'plan_updates' => $report->plan_updates ?? [],
                            'reported_at' => $report->reported_at,
                        ];
                    });

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'location' => $project->location,
                    'progress' => $project->progress ?? 0,
                    'status' => $project->status ?? 'on_track',
                    'deadline' => $project->end_date,
                    'end_date' => $project->end_date,
                    'engineer_progress_reports' => $engineerReports,
                ];
            });

            // Get recent progress reports
            $recentReports = EngineerProgressReport::where('user_id', $user->id)
                ->with('project')
                ->latest()
                ->take(5)
                ->get();

            $averageProgress = (int) round($formattedProjects->avg('progress') ?? 0);
            $inProgressProjects = $formattedProjects->where('progress', '<', 100)->count();
            $completedProjects = $formattedProjects->where('progress', '>=', 100)->count();
            $totalReports = EngineerProgressReport::where('user_id', $user->id)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'assigned_projects' => $formattedProjects,
                    'recent_reports' => $recentReports,
                    'stats' => [
                        'total_projects' => $formattedProjects->count(),
                        'completed_projects' => $completedProjects,
                        'in_progress_projects' => $inProgressProjects,
                        'total_reports' => $totalReports,
                        'projects' => [
                            'assigned' => $formattedProjects->count(),
                            'active' => $inProgressProjects,
                        ],
                        'progress' => [
                            'average' => $averageProgress,
                        ],
                        'reports' => [
                            'submitted' => $totalReports,
                        ],
                        'tasks' => [
                            'completed' => $completedProjects,
                        ],
                    ],
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
                    $reportColumns = ['id', 'progress_percentage', 'notes', 'photo', 'reported_at'];

                    if (Schema::hasColumn('engineer_progress_reports', 'material_updates')) {
                        $reportColumns[] = 'material_updates';
                    }

                    if (Schema::hasColumn('engineer_progress_reports', 'plan_updates')) {
                        $reportColumns[] = 'plan_updates';
                    }

                    $reports = $p->engineerProgressReports()
                        ->where('user_id', auth()->id())
                        ->latest()
                        ->get($reportColumns);

                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'description' => $p->description,
                        'location' => $p->location ?? '',
                        'progress' => $p->progress ?? 0,
                        'deadline' => $p->end_date ?? $p->deadline,
                        'end_date' => $p->end_date ?? $p->deadline,
                        'status' => $p->status ?? 'on_track',
                        'rab' => $p->rab ?? $p->budget ?? 0,
                        'engineer_progress_reports' => $reports,
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
                'progress_percentage' => 'nullable|integer|min:0|max:100',
                'notes' => 'nullable|string',
                'photo' => 'required|string',
                'material_updates' => 'nullable|array',
                'material_updates.*.material_id' => 'required_with:material_updates|exists:materials,id',
                'material_updates.*.qty_terpasang' => 'required_with:material_updates|numeric|min:0.01',
                'material_updates.*.catatan' => 'nullable|string',
                'plan_updates' => 'required|array|min:1',
                'plan_updates.*.name' => 'required_with:plan_updates|string|max:255',
                'plan_updates.*.items' => 'required|array|min:1',
                'plan_updates.*.items.*.material_id' => 'required_with:plan_updates.*.items|exists:materials,id',
                'plan_updates.*.items.*.qty_terpasang' => 'required_with:plan_updates.*.items|numeric|min:0.01',
                'plan_updates.*.items.*.catatan' => 'nullable|string',
            ]);

            $user = Auth::user();
            $project = Project::findOrFail($request->project_id);
            
            $isAdmin = in_array($user->role, ['administrator', 'admin'], true);
            $isSiteManagerOwner = $user->role === 'site_manager' && (
                (int) $project->project_manager_id === (int) $user->id
                || (isset($project->site_manager_id) && (int) $project->site_manager_id === (int) $user->id)
                || (isset($project->created_by) && (int) $project->created_by === (int) $user->id)
                || (isset($project->user_id) && (int) $project->user_id === (int) $user->id)
            );
            $isAssignedEngineer = ProjectAssignment::where('project_id', $request->project_id)
                ->where('user_id', $user->id)
                ->exists()
                || in_array((string) $user->id, array_map('strval', (array) ($project->assigned_engineers ?? [])), true);

            if (!$isAdmin && !$isSiteManagerOwner && !$isAssignedEngineer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk mengupdate progress proyek ini'
                ], 403);
            }

            $planInput = collect($request->input('plan_updates', []))
                ->filter(fn($item) => trim((string) ($item['name'] ?? '')) !== '')
                ->values();

            if ($planInput->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Minimal isi 1 plan pekerjaan'
                ], 422);
            }

            $planMaterialUpdates = $planInput
                ->flatMap(function ($plan) {
                    return collect($plan['items'] ?? [])->map(function ($item) {
                        return [
                            'material_id' => $item['material_id'] ?? null,
                            'qty_terpasang' => $item['qty_terpasang'] ?? 0,
                            'catatan' => $item['catatan'] ?? null,
                        ];
                    });
                });

            $materialUpdates = collect($request->input('material_updates', []))
                ->merge($planMaterialUpdates)
                ->filter(fn($item) => !empty($item['material_id']) && (float) ($item['qty_terpasang'] ?? 0) > 0)
                ->values();

            if ($materialUpdates->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Minimal isi 1 barang dengan qty progress lebih dari 0'
                ], 422);
            }

            $materialUpdateTotals = $materialUpdates
                ->groupBy(fn($item) => (int) $item['material_id'])
                ->map(fn($items) => $items->sum(fn($item) => (float) ($item['qty_terpasang'] ?? 0)));

            $materialsById = Material::where('project_id', $request->project_id)
                ->whereIn('id', $materialUpdateTotals->keys()->all())
                ->get()
                ->keyBy('id');

            foreach ($materialUpdateTotals as $materialId => $requestedQty) {
                $material = $materialsById->get((int) $materialId);

                if (!$material) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Material tidak ditemukan di proyek ini'
                    ], 422);
                }

                $remainingQty = max(0, (float) $material->qty_plan - (float) $material->qty_terpasang);
                if ((float) $requestedQty > $remainingQty) {
                    return response()->json([
                        'success' => false,
                        'message' => "Qty {$material->name} melebihi sisa. Sisa: {$remainingQty} {$material->unit}"
                    ], 422);
                }
            }

            // Handle photo upload after every procedural validation passes.
            $photoPath = null;
            $photoData = $request->photo;
            if (strpos($photoData, 'data:image') === 0) {
                $photoData = substr($photoData, strpos($photoData, ',') + 1);
            }

            $photoContent = base64_decode($photoData, true);
            if ($photoContent === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format foto tidak valid'
                ], 422);
            }

            $photoName = 'progress_' . $user->id . '_' . time() . '.jpg';
            $photoPath = 'progress_photos/' . $photoName;

            Storage::disk('public')->put($photoPath, $photoContent);

            DB::beginTransaction();

            $appliedMaterialUpdates = [];
            foreach ($materialUpdates as $item) {
                $material = $materialsById->get((int) $item['material_id']);

                $additionalQty = (float) $item['qty_terpasang'];
                $newQty = (float) $material->qty_terpasang + $additionalQty;

                $material->update([
                    'qty_terpasang' => $newQty,
                ]);
                $material->qty_terpasang = $newQty;

                $appliedMaterialUpdates[] = [
                    'material_id' => $material->id,
                    'name' => $material->name,
                    'unit' => $material->unit,
                    'qty_terpasang' => $additionalQty,
                    'total_terpasang' => (float) $newQty,
                    'qty_plan' => (float) $material->qty_plan,
                    'catatan' => $item['catatan'] ?? null,
                ];
            }

            $materialsById = Material::where('project_id', $request->project_id)
                ->get()
                ->keyBy('id');

            $planUpdates = $planInput
                ->map(function ($plan) use ($materialsById) {
                    $items = collect($plan['items'] ?? [])
                        ->filter(fn($item) => !empty($item['material_id']))
                        ->map(function ($item) use ($materialsById) {
                            $material = $materialsById->get((int) $item['material_id']);

                            if (!$material) {
                                return null;
                            }

                            $qtyPlan = (float) $material->qty_plan;
                            $totalTerpasang = (float) $material->qty_terpasang;
                            $itemProgress = $qtyPlan > 0
                                ? (int) round(min(($totalTerpasang / $qtyPlan) * 100, 100))
                                : 0;

                            return [
                                'material_id' => $material->id,
                                'name' => $material->name,
                                'unit' => $material->unit,
                                'qty_terpasang' => (float) ($item['qty_terpasang'] ?? 0),
                                'total_terpasang' => $totalTerpasang,
                                'qty_plan' => $qtyPlan,
                                'progress_percentage' => $itemProgress,
                                'catatan' => $item['catatan'] ?? null,
                            ];
                        })
                        ->filter()
                        ->values();

                    $planProgress = $items->count() > 0
                        ? (int) round($items->avg('progress_percentage'))
                        : 0;

                    return [
                        'name' => trim((string) $plan['name']),
                        'progress_percentage' => $planProgress,
                        'items' => $items->all(),
                    ];
                })
                ->values();

            $calculatedProgress = (int) round($planUpdates->avg('progress_percentage'));

            // Create progress report
            $reportPayload = [
                'project_id' => $request->project_id,
                'user_id' => $user->id,
                'progress_percentage' => $calculatedProgress,
                'notes' => $request->notes,
                'photo' => $photoPath,
                'reported_at' => now()
            ];

            if (Schema::hasColumn('engineer_progress_reports', 'material_updates')) {
                $reportPayload['material_updates'] = $appliedMaterialUpdates;
            }

            if (Schema::hasColumn('engineer_progress_reports', 'plan_updates')) {
                $reportPayload['plan_updates'] = $planUpdates->all();
            }

            $report = EngineerProgressReport::create($reportPayload);

            if ($photoPath && Schema::hasTable('documents')) {
                Document::create([
                    'project_id' => $project->id,
                    'uploaded_by' => $user->id,
                    'type' => 'Foto Progress',
                    'name' => 'Foto Progress ' . now()->format('d-m-Y H-i') . '.jpg',
                    'file_path' => $photoPath,
                    'file_url' => Storage::disk('public')->url($photoPath),
                    'file_size' => Storage::disk('public')->size($photoPath),
                    'mime_type' => 'image/jpeg',
                ]);
            }

            // Update project progress from cumulative material installation only.
            $materials = Material::where('project_id', $request->project_id)->get();
            $finalProgress = $materials->count() > 0
                ? (int) round($materials->avg(fn($material) => min((((float) $material->qty_terpasang) / max((float) $material->qty_plan, 1)) * 100, 100)))
                : 0;
            
            // Auto-complete project if progress reaches 100%
            if ($finalProgress >= 100 && $project->status !== 'completed') {
                Project::where('id', $request->project_id)->update([
                    'progress' => 100,
                    'status' => 'completed',
                    'completed_at' => now()
                ]);
                
                // Send notification to Site Manager
                if ($project->project_manager_id) {
                    \App\Models\ProjectNotification::create([
                        'project_id' => $project->id,
                        'user_id' => $project->project_manager_id,
                        'title' => 'Proyek Selesai',
                        'message' => "Proyek '{$project->name}' telah mencapai 100% dan ditandai selesai oleh {$user->name}",
                        'type' => 'success',
                        'is_read' => false,
                    ]);
                }
                
                // Log activity
                ActivityLogger::log($user, 'Proyek Selesai', "Proyek '{$project->name}' selesai dengan progress 100%", $project->id);
            } else {
                Project::where('id', $request->project_id)->update([
                    'progress' => $finalProgress
                ]);
            }

            NotificationHelper::progressUpdated($project->fresh(), $user, $finalProgress);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Progress report submitted successfully',
                'data' => $report->load('project')
            ]);
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

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
