<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'assigned_to',
        'tanggal_visit',
        'waktu_visit',
        'lokasi',
        'tujuan',
        'catatan',
        'status',
        'created_by',
        'sales_manager_id',
        'keterangan',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'tanggal_visit' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Get the user who approved this plan visit
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the customer for this visit plan
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user assigned to this visit
     */
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    
    /**
     * Alias for assignedUser (for backward compatibility)
     */
    public function assignedToUser()
    {
        return $this->assignedUser();
    }
    
    /**
     * Another alias for assignedUser (for API consistency)
     */
    public function assignedTo()
    {
        return $this->assignedUser();
    }

    /**
     * Get the user who created this visit plan
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    /**
     * Alias for creator (for API consistency)
     */
    public function createdBy()
    {
        return $this->creator();
    }

    /**
     * Get the realisasi visit for this plan
     */
    public function realisasiVisit()
    {
        return $this->hasOne(RealisasiVisit::class);
    }

    /**
     * Check if this visit has been completed
     */
    public function getIsCompletedAttribute()
    {
        return $this->realisasiVisit && $this->realisasiVisit->status === 'done';
    }

    /**
     * Check if this visit was missed
     */
    public function getIsMissedAttribute()
    {
        return $this->realisasiVisit && $this->realisasiVisit->status === 'missed';
    }

    /**
     * Get the visit status (computed from realisasi)
     */
    public function getVisitStatusAttribute()
    {
        if (!$this->realisasiVisit) {
            // Check if visit date has passed
            if ($this->tanggal_visit < now()->toDateString()) {
                return 'overdue';
            }
            return 'pending';
        }

        return $this->realisasiVisit->status;
    }

    /**
     * Scope for pending visits
     */
    public function scopePending($query)
    {
        return $query->whereDoesntHave('realisasiVisit');
    }

    /**
     * Scope for overdue visits
     */
    public function scopeOverdue($query)
    {
        return $query->whereDoesntHave('realisasiVisit')
                    ->where('tanggal_visit', '<', now()->toDateString());
    }

    /**
     * Scope for today's visits
     */
    public function scopeToday($query)
    {
        return $query->where('tanggal_visit', now()->toDateString());
    }

    /**
     * Scope for visits assigned to specific user
     */
    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }
}