<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectNotification extends Model
{
    // type: over_budget | deadline_warning | milestone | info
    protected $fillable = [
        'project_id', 'type', 'title', 'message', 'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
