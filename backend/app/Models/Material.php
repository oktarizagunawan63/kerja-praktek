<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    protected $fillable = ['project_id', 'name', 'unit', 'qty_plan', 'qty_terpasang'];

    protected $casts = [
        'qty_plan'      => 'decimal:2',
        'qty_terpasang' => 'decimal:2',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
