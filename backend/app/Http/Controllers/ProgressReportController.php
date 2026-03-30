<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProgressReport;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class ProgressReportController extends Controller
{
    public function index(Project $project)
    {
        return response()->json(
            $project->progressReports()
                ->with('user:id,name,role')
                ->orderByDesc('report_date')
                ->paginate(20)
        );
    }

    public function store(Request $request, Project $project)
    {
        $data = $request->validate([
            'progress_pct' => 'required|integer|min:0|max:100',
            'kendala'      => 'nullable|string',
            'catatan'      => 'nullable|string',
            'report_date'  => 'required|date',
        ]);

        $data['project_id'] = $project->id;
        $data['user_id']    = $request->user()->id;

        $report = ProgressReport::create($data);

        // Update project progress to latest
        $project->update(['progress' => $data['progress_pct']]);

        ActivityLogger::log(
            $request->user(),
            'input_progress',
            "Input progress {$data['progress_pct']}% untuk proyek: {$project->name}",
        );

        return response()->json($report->load('user:id,name'), 201);
    }
}
