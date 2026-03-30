<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'name', 'unit', 'qty_plan', 'qty_used', 'qty_stock',
    ];

    protected $casts = [
        'qty_plan'  => 'decimal:2',
        'qty_used'  => 'decimal:2',
        'qty_stock' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function getUsagePctAttribute(): float
    {
        if ($this->qty_plan == 0) return 0;
        return round(($this->qty_used / $this->qty_plan) * 100, 1);
    }
}
