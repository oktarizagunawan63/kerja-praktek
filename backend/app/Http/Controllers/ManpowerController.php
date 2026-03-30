<?php

namespace App\Http\Controllers;

use App\Models\Manpower;
use App\Models\Project;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class ManpowerController extends Controller
{
    public function index(Request $request)
    {
        $query = Manpower::with('project:id,name');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('name')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'  => 'required|exists:projects,id',
            'name'        => 'required|string|max:255',
            'role'        => 'required|string|max:100',
            'status'      => 'required|in:active,inactive',
            'joined_date' => 'required|date',
        ]);

        $manpower = Manpower::create($data);
        ActivityLogger::log($request->user(), 'add_manpower', "Tambah manpower: {$manpower->name}");

        return response()->json($manpower->load('project:id,name'), 201);
    }

    public function update(Request $request, Manpower $manpower)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'role'        => 'sometimes|string|max:100',
            'status'      => 'sometimes|in:active,inactive',
            'joined_date' => 'sometimes|date',
        ]);

        $manpower->update($data);
        return response()->json($manpower->fresh());
    }

    public function destroy(Manpower $manpower)
    {
        $manpower->delete();
        return response()->json(['message' => 'Manpower dihapus']);
    }

    public function distribution()
    {
        $data = Manpower::where('status', 'active')
            ->selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->get();

        return response()->json($data);
    }
}
