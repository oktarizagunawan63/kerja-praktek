<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FunnelActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'funnel_id',
        'activity_type',
        'activity_date',
        'notes',
        'previous_stage',
        'new_stage',
        'previous_probability',
        'new_probability',
        'created_by'
    ];

    protected $casts = [
        'activity_date' => 'datetime'
    ];

    // Relationships
    public function funnel()
    {
        return $this->belongsTo(SalesFunnel::class, 'funnel_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Boot method to auto-update funnel's last_activity_at
    protected static function boot()
    {
        parent::boot();

        static::created(function ($activity) {
            $activity->funnel->updateLastActivity();
        });
    }

    // Accessors
    public function getActivityTypeLabel()
    {
        $labels = [
            'telepon' => 'Telepon',
            'whatsapp' => 'WhatsApp',
            'email' => 'Email',
            'visit' => 'Visit',
            'meeting' => 'Meeting',
            'demo' => 'Demo Produk',
            'kirim_penawaran' => 'Kirim Penawaran',
            'revisi_penawaran' => 'Revisi Penawaran',
            'lainnya' => 'Lainnya'
        ];
        
        return $labels[$this->activity_type] ?? 'Unknown';
    }

    public function getActivityTypeIconAttribute()
    {
        $icons = [
            'telepon' => 'phone',
            'whatsapp' => 'message-circle',
            'email' => 'mail',
            'visit' => 'map-pin',
            'meeting' => 'users',
            'demo' => 'monitor',
            'kirim_penawaran' => 'file-text',
            'revisi_penawaran' => 'edit',
            'lainnya' => 'more-horizontal'
        ];
        
        return $icons[$this->activity_type] ?? 'circle';
    }

    public function hasStageChange()
    {
        return $this->previous_stage && $this->new_stage && $this->previous_stage !== $this->new_stage;
    }

    public function hasProbabilityChange()
    {
        return $this->previous_probability && $this->new_probability && $this->previous_probability !== $this->new_probability;
    }
}
