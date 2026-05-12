<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class SalesFunnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'customer_name',
        'customer_company',
        'customer_phone',
        'customer_email',
        'channel',
        'channel_other',
        'city',
        'province',
        'segment',
        'segment_custom',
        'qty',
        'unit',
        'estimated_value',
        'deal_stage',
        'deadline_date',
        'target_close_date',
        'win_probability',
        'win_percentage',
        'competitor_name',
        'competitor_notes',
        'initial_notes',
        'status',
        'won_value',
        'won_reason_category',
        'won_notes',
        'won_date',
        'lost_reason_category',
        'lost_competitor',
        'lost_notes',
        'lost_date',
        'assigned_to',
        'created_by',
        'last_activity_at'
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'won_value' => 'decimal:2',
        'qty' => 'decimal:2',
        'win_percentage' => 'integer',
        'deadline_date' => 'date',
        'target_close_date' => 'date',
        'won_date' => 'date',
        'lost_date' => 'date',
        'last_activity_at' => 'datetime'
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activities()
    {
        return $this->hasMany(FunnelActivity::class, 'funnel_id');
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeWon($query)
    {
        return $query->where('status', 'won');
    }

    public function scopeLost($query)
    {
        return $query->where('status', 'lost');
    }

    public function scopeMyFunnels($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeNeedsFollowUp($query)
    {
        $sevenDaysAgo = Carbon::now()->subDays(7);
        return $query->where('status', 'open')
                    ->where(function($q) use ($sevenDaysAgo) {
                        $q->whereNull('last_activity_at')
                          ->orWhere('last_activity_at', '<', $sevenDaysAgo);
                    });
    }

    public function scopeApproachingDeadline($query)
    {
        $threeDaysFromNow = Carbon::now()->addDays(3);
        return $query->where('status', 'open')
                    ->where('target_close_date', '<=', $threeDaysFromNow)
                    ->where('target_close_date', '>=', Carbon::now());
    }

    // Accessors
    public function getFormattedEstimatedValueAttribute()
    {
        return 'Rp ' . number_format($this->estimated_value, 0, ',', '.');
    }

    public function getFormattedWonValueAttribute()
    {
        return $this->won_value ? 'Rp ' . number_format($this->won_value, 0, ',', '.') : null;
    }

    public function getStatusBadgeAttribute()
    {
        $badges = [
            'open' => ['color' => 'blue', 'label' => 'Open'],
            'won' => ['color' => 'green', 'label' => 'Menang'],
            'lost' => ['color' => 'red', 'label' => 'Kalah']
        ];
        
        return $badges[$this->status] ?? $badges['open'];
    }

    public function getDealStageBadgeAttribute()
    {
        $badges = [
            'prospek' => ['color' => 'gray', 'label' => 'Prospek'],
            'qualified' => ['color' => 'blue', 'label' => 'Qualified'],
            'proposal' => ['color' => 'yellow', 'label' => 'Proposal'],
            'negosiasi' => ['color' => 'orange', 'label' => 'Negosiasi'],
            'closing' => ['color' => 'green', 'label' => 'Closing']
        ];
        
        return $badges[$this->deal_stage] ?? $badges['prospek'];
    }

    public function getWinProbabilityBadgeAttribute()
    {
        $badges = [
            'low' => ['color' => 'red', 'label' => 'Low', 'percentage' => 25],
            'middle' => ['color' => 'yellow', 'label' => 'Middle', 'percentage' => 50],
            'high' => ['color' => 'green', 'label' => 'High', 'percentage' => 75],
            'very_high' => ['color' => 'blue', 'label' => 'Very High', 'percentage' => 90]
        ];
        
        return $badges[$this->win_probability] ?? $badges['middle'];
    }

    public function getNeedsFollowUpAttribute()
    {
        if ($this->status !== 'open') {
            return false;
        }
        
        if (!$this->last_activity_at) {
            return true;
        }
        
        $daysSinceLastActivity = Carbon::now()->diffInDays($this->last_activity_at);
        return $daysSinceLastActivity >= 7;
    }

    public function getIsApproachingDeadlineAttribute()
    {
        if ($this->status !== 'open') {
            return false;
        }
        
        $daysUntilDeadline = Carbon::now()->diffInDays($this->target_close_date, false);
        return $daysUntilDeadline >= 0 && $daysUntilDeadline <= 3;
    }

    // Helper Methods
    public static function getWinPercentageByProbability($probability)
    {
        $percentages = [
            'low' => 25,
            'middle' => 50,
            'high' => 75,
            'very_high' => 90
        ];
        
        return $percentages[$probability] ?? 50;
    }

    public function updateLastActivity()
    {
        $this->last_activity_at = Carbon::now();
        $this->save();
    }
}
