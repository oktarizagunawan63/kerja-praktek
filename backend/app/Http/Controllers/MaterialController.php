<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Project;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index(Project $project)
    {
        return response()->json($project->materials()->orderBy('name')->get());
    }

    public function store(Request $request, Project $project)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'unit'      => 'required|string|max:50',
            'qty_plan'  => 'required|numeric|min:0',
            'qty_used'  => 'required|numeric|min:0',
            'qty_stock' => 'required|numeric|min:0',
        ]);

        $data['project_id'] = $project->id;
        $material = Material::create($data);

        return response()->json($material, 201);
    }

    public function update(Request $request, Project $project, Material $material)
    {
        $data = $request->validate([
            'qty_used'  => 'sometimes|numeric|min:0',
            'qty_stock' => 'sometimes|numeric|min:0',
            'qty_plan'  => 'sometimes|numeric|min:0',
        ]);

        $material->update($data);
        return response()->json($material->fresh());
    }
}
