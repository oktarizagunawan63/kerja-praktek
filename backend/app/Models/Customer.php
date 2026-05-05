<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'company',
        'phone',
        'email',
        'address',
        'latitude',
        'longitude',
        'created_by',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Get the user who approved this customer
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who created this customer
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all plan visits for this customer
     */
    public function planVisits()
    {
        return $this->hasMany(PlanVisit::class);
    }

    /**
     * Get completed visits for this customer
     */
    public function completedVisits()
    {
        return $this->hasManyThrough(
            RealisasiVisit::class,
            PlanVisit::class,
            'customer_id',
            'plan_visit_id'
        )->where('realisasi_visits.status', 'done');
    }

    /**
     * Get visit statistics for this customer
     */
    public function getVisitStatsAttribute()
    {
        $totalPlanned = $this->planVisits()->count();
        $totalCompleted = $this->completedVisits()->count();
        $totalMissed = $this->hasManyThrough(
            RealisasiVisit::class,
            PlanVisit::class,
            'customer_id',
            'plan_visit_id'
        )->where('realisasi_visits.status', 'missed')->count();

        return [
            'total_planned' => $totalPlanned,
            'total_completed' => $totalCompleted,
            'total_missed' => $totalMissed,
            'completion_rate' => $totalPlanned > 0 ? round(($totalCompleted / $totalPlanned) * 100, 2) : 0
        ];
    }
}