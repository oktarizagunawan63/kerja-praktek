<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Project;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index(Project $project)
    {
        return response()->json($project->materials()->orderBy('name')->get()->map(fn($m) => $this->format($m)));
    }

    public function store(Request $request, Project $project)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'unit'           => 'required|string|max:50',
            'qty_plan'       => 'required|numeric|min:0',
            'qty_terpasang'  => 'sometimes|numeric|min:0',
        ]);

        $material = $project->materials()->create([
            'name'          => $data['name'],
            'unit'          => $data['unit'],
            'qty_plan'      => $data['qty_plan'],
            'qty_terpasang' => $data['qty_terpasang'] ?? 0,
        ]);

        ActivityLogger::log($request->user(), 'Tambah Material', "{$material->name} ({$material->qty_plan} {$material->unit})", $project->id);

        return response()->json($this->format($material), 201);
    }

    public function update(Request $request, Project $project, Material $material)
    {
        $data = $request->validate([
            'qty_terpasang' => 'required|numeric|min:0',
            'catatan'       => 'nullable|string',
        ]);

        $newQty = min($material->qty_terpasang + $data['qty_terpasang'], $material->qty_plan);
        $material->update(['qty_terpasang' => $newQty]);

        // Recalculate project progress
        $materials = $project->materials;
        if ($materials->count() > 0) {
            $progress = (int) round($materials->avg(fn($m) => min(($m->qty_terpasang / max($m->qty_plan, 1)) * 100, 100)));
            $project->update(['progress' => $progress]);
        }

        ActivityLogger::log($request->user(), 'Update Material Terpasang', "Tambah {$data['qty_terpasang']} {$material->unit} {$material->name}" . ($data['catatan'] ? ' — '.$data['catatan'] : ''), $project->id);

        return response()->json($this->format($material->fresh()));
    }

    public function destroy(Request $request, Project $project, Material $material)
    {
        ActivityLogger::log($request->user(), 'Hapus Material', "Hapus: {$material->name}", $project->id);
        $material->delete();
        return response()->json(['message' => 'Material dihapus']);
    }

    private function format(Material $m): array
    {
        return [
            'id'             => $m->id,
            'name'           => $m->name,
            'unit'           => $m->unit,
            'qty_plan'       => (float)$m->qty_plan,
            'qty_terpasang'  => (float)$m->qty_terpasang,
        ];
    }
}
