<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectNotification extends Model
{
    // type: over_budget | deadline_warning | milestone | info | welcome
    protected $fillable = [
        'project_id', 'user_id', 'type', 'title', 'message', 'is_read', 'metadata',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
