<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'user_id', 'progress_pct',
        'kendala', 'catatan', 'report_date',
    ];

    protected $casts = [
        'report_date'  => 'date',
        'progress_pct' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
