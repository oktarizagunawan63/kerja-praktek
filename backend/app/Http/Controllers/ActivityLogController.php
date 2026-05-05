<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,name,role')
            ->orderByDesc('created_at');

        if ($request->filled('action'))    $query->where('action', $request->action);
        if ($request->filled('date_from')) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->whereDate('created_at', '<=', $request->date_to);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('action', 'like', "%$s%")->orWhere('description', 'like', "%$s%"));
        }

        return response()->json($query->limit(100)->get()->map(fn($a) => [
            'id'      => $a->id,
            'user'    => $a->user?->name ?? '-',
            'role'    => $a->user?->role ?? '-',
            'action'  => $a->action,
            'detail'  => $a->description,
            'project' => $a->project_id ? optional(\App\Models\Project::find($a->project_id))->name ?? '-' : '-',
            'time'    => $a->created_at?->format('d/m/Y, H.i.s'),
        ]));
    }
}
