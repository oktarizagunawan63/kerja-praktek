<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'division',
        'is_active', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'assigned_projects', 'phone',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active'         => 'boolean',
        'assigned_projects' => 'array',
        'approved_at'       => 'datetime',
    ];

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'project_manager_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Visit Management relationships
    public function createdCustomers()
    {
        return $this->hasMany(Customer::class, 'created_by');
    }

    public function createdPlanVisits()
    {
        return $this->hasMany(PlanVisit::class, 'created_by');
    }

    public function assignedPlanVisits()
    {
        return $this->hasMany(PlanVisit::class, 'assigned_to');
    }

    public function realisasiVisits()
    {
        return $this->hasMany(RealisasiVisit::class, 'visited_by');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function warnings()
    {
        return $this->hasMany(Warning::class);
    }

    // Role checking methods
    public function isSalesManager()
    {
        return $this->role === 'sales_manager';
    }

    public function isSales()
    {
        return $this->role === 'sales';
    }

    public function isAdministrator()
    {
        return $this->role === 'administrator';
    }

    public function isEngineer()
    {
        return $this->role === 'engineer';
    }

    // Check if user can access visit management
    public function canAccessVisitManagement()
    {
        return in_array($this->role, ['sales_manager', 'sales']) || $this->division === 'sales_manager';
    }

    // Division checking methods
    public function isSiteManagerDivision()
    {
        return $this->division === 'site_manager';
    }

    public function isSalesManagerDivision()
    {
        return $this->division === 'sales_manager';
    }

    // Check if user should see construction projects
    public function canAccessConstructionProjects()
    {
        return $this->role === 'administrator' || $this->division === 'site_manager';
    }

    // Check if user should see visit management
    public function canAccessVisits()
    {
        return $this->role === 'administrator' || $this->division === 'sales_manager';
    }
}
