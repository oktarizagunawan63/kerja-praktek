<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EngineerProgressReport extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'progress_percentage',
        'notes',
        'photo',
        'material_updates',
        'plan_updates',
        'reported_at',
    ];

    protected $casts = [
        'reported_at' => 'datetime',
        'progress_percentage' => 'integer',
        'material_updates' => 'array',
        'plan_updates' => 'array',
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
