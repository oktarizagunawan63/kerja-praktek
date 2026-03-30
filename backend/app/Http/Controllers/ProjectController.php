<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNotification;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with('projectManager:id,name')
            ->withCount(['manpowers', 'documents']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('date_from')) {
            $query->whereDate('start_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('end_date', '<=', $request->date_to);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(12));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'description'        => 'nullable|string',
            'location'           => 'required|string|max:255',
            'start_date'         => 'required|date',
            'end_date'           => 'required|date|after:start_date',
            'budget'             => 'required|numeric|min:0',
            'project_manager_id' => 'required|exists:users,id',
        ]);

        $data['status']           = 'on_track';
        $data['progress']         = 0;
        $data['budget_realisasi'] = 0;

        $project = Project::create($data);

        ActivityLogger::log($request->user(), 'create_project', "Membuat proyek: {$project->name}");

        return response()->json($project->load('projectManager:id,name'), 201);
    }

    public function show(Project $project)
    {
        return response()->json(
            $project->load([
                'projectManager:id,name',
                'manpowers',
                'materials',
                'progressReports.user:id,name',
                'documents.uploader:id,name',
            ])
        );
    }

    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name'               => 'sometimes|string|max:255',
            'description'        => 'nullable|string',
            'location'           => 'sometimes|string|max:255',
            'start_date'         => 'sometimes|date',
            'end_date'           => 'sometimes|date',
            'budget'             => 'sometimes|numeric|min:0',
            'budget_realisasi'   => 'sometimes|numeric|min:0',
            'progress'           => 'sometimes|integer|min:0|max:100',
            'status'             => 'sometimes|in:on_track,at_risk,delayed,completed',
            'project_manager_id' => 'sometimes|exists:users,id',
        ]);

        $project->update($data);

        // Auto-check over budget
        if ($project->budget_realisasi > $project->budget) {
            ProjectNotification::firstOrCreate(
                ['project_id' => $project->id, 'type' => 'over_budget', 'is_read' => false],
                [
                    'title'   => 'Over Budget!',
                    'message' => "{$project->name} melebihi anggaran.",
                ]
            );
        }

        // Auto-check deadline warning (< 30 days remaining, progress < 80%)
        $daysLeft = now()->diffInDays($project->end_date, false);
        if ($daysLeft <= 30 && $daysLeft > 0 && $project->progress < 80) {
            ProjectNotification::firstOrCreate(
                ['project_id' => $project->id, 'type' => 'deadline_warning', 'is_read' => false],
                [
                    'title'   => 'Mendekati Deadline',
                    'message' => "{$project->name} deadline dalam {$daysLeft} hari, progress {$project->progress}%.",
                ]
            );
        }

        ActivityLogger::log($request->user(), 'update_project', "Update proyek: {$project->name}");

        return response()->json($project->fresh());
    }

    public function destroy(Request $request, Project $project)
    {
        ActivityLogger::log($request->user(), 'delete_project', "Hapus proyek: {$project->name}");
        $project->delete();
        return response()->json(['message' => 'Proyek dihapus']);
    }

    public function kpiSummary()
    {
        return response()->json([
            'total_projects'      => Project::count(),
            'active_projects'     => Project::whereNotIn('status', ['completed'])->count(),
            'total_budget'        => Project::sum('budget'),
            'total_realisasi'     => Project::sum('budget_realisasi'),
            'avg_progress'        => round(Project::avg('progress'), 1),
            'delayed_count'       => Project::where('status', 'delayed')->count(),
            'at_risk_count'       => Project::where('status', 'at_risk')->count(),
        ]);
    }
}
