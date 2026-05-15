<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'description', 'location', 'status',
        'start_date', 'end_date', 'rab', 'rab_realisasi',
        'progress', 'project_manager_id', 'pm_name', 'pm_email',
        'completed_at', 'assigned_engineers', 'created_by',
        'site_manager_id', 'user_id',
    ];

    protected $casts = [
        'start_date'         => 'date:Y-m-d',
        'end_date'           => 'date:Y-m-d',
        'completed_at'       => 'datetime',
        'rab'                => 'decimal:2',
        'rab_realisasi'      => 'decimal:2',
        'progress'           => 'integer',
        'assigned_engineers' => 'array',
    ];

    public function projectManager()  { return $this->belongsTo(User::class, 'project_manager_id'); }
    public function materials()       { return $this->hasMany(Material::class); }
    public function documents()       { return $this->hasMany(Document::class); }
    public function notifications()   { return $this->hasMany(ProjectNotification::class); }
    
    public function assignments()
    {
        return $this->hasMany(ProjectAssignment::class);
    }

    public function assignedEngineers()
    {
        return $this->belongsToMany(User::class, 'project_assignments', 'project_id', 'user_id')
                    ->withPivot('assigned_by', 'assigned_at')
                    ->withTimestamps();
    }

    public function engineers()
    {
        return $this->hasManyThrough(
            User::class,
            ProjectAssignment::class,
            'project_id', // Foreign key on project_assignments table
            'id',         // Foreign key on users table
            'id',         // Local key on projects table
            'user_id'     // Local key on project_assignments table
        );
    }

    public function engineerProgressReports()
    {
        return $this->hasMany(EngineerProgressReport::class);
    }

    public function progressReports()
    {
        return $this->hasMany(\App\Models\EngineerProgressReport::class);
    }

    public function siteManager()
    {
        return $this->belongsTo(\App\Models\User::class, 'site_manager_id');
    }
}
