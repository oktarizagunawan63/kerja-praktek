<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Manpower extends Model
{
    use HasFactory;

    protected $table = 'manpower';

    protected $fillable = [
        'project_id', 'name', 'role', 'status', 'joined_date',
    ];

    protected $casts = [
        'joined_date' => 'date',
        'is_active'   => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
