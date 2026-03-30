<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    // status: on_track | at_risk | delayed | completed
    protected $fillable = [
        'name', 'description', 'location', 'status',
        'start_date', 'end_date', 'budget', 'budget_realisasi',
        'progress', 'project_manager_id',
    ];

    protected $casts = [
        'start_date'       => 'date',
        'end_date'         => 'date',
        'budget'           => 'decimal:2',
        'budget_realisasi' => 'decimal:2',
        'progress'         => 'integer',
    ];

    public function projectManager()
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function manpowers()
    {
        return $this->hasMany(Manpower::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    public function progressReports()
    {
        return $this->hasMany(ProgressReport::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function notifications()
    {
        return $this->hasMany(ProjectNotification::class);
    }
}
