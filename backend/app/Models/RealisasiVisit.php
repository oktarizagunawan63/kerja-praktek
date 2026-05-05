<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RealisasiVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_visit_id',
        'type',
        'customer_id',
        'customer_name',
        'customer_company',
        'customer_phone',
        'customer_address',
        'visit_date',
        'visit_time',
        'actual_duration',
        'visit_purpose',
        'meeting_notes',
        'visit_outcome',
        'deal_amount',
        'deal_notes',
        'status',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'notes',
        'latitude',
        'longitude',
        'photos',
        'visited_by',
    ];

    protected $casts = [
        'visit_time' => 'datetime',
        'visit_date' => 'date',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'photos' => 'array',
        'deal_amount' => 'decimal:2',
        'actual_duration' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who approved this visit
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the direct customer for unplanned visits
     */
    public function directCustomer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Get the plan visit for this realisasi
     */
    public function planVisit()
    {
        return $this->belongsTo(PlanVisit::class);
    }

    /**
     * Get the user who visited
     */
    public function visitor()
    {
        return $this->belongsTo(User::class, 'visited_by');
    }

    /**
     * Get the customer through plan visit
     */
    public function customer()
    {
        return $this->hasOneThrough(
            Customer::class,
            PlanVisit::class,
            'id',
            'id',
            'plan_visit_id',
            'customer_id'
        );
    }

    /**
     * Scope for completed visits
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'done');
    }

    /**
     * Scope for missed visits
     */
    public function scopeMissed($query)
    {
        return $query->where('status', 'missed');
    }

    /**
     * Scope for visits by specific user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('visited_by', $userId);
    }

    /**
     * Scope for visits in date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('visit_time', [$startDate, $endDate]);
    }

    /**
     * Get formatted visit duration
     */
    public function getVisitDurationAttribute()
    {
        if (!$this->visit_time) {
            return null;
        }

        // Calculate duration based on check-in and check-out times
        // This would need to be enhanced with actual check-out time
        return 'N/A';
    }

    /**
     * Check if visit has photos
     */
    public function getHasPhotosAttribute()
    {
        return !empty($this->photos);
    }

    /**
     * Get photo count
     */
    public function getPhotoCountAttribute()
    {
        return is_array($this->photos) ? count($this->photos) : 0;
    }
}