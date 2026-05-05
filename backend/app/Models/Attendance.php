<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendances'; // FIXED: Use correct table name

    protected $fillable = [
        'user_id',
        'date',
        'check_in_time',
        'check_out_time',
        'check_in_latitude',
        'check_in_longitude',
        'check_out_latitude',
        'check_out_longitude',
        'check_in_photo',
        'check_out_photo',
        'gps_warning',
        'distance_from_office',
        'gps_data',
        'device_info',
        'status',
        'notes'
    ];

    protected $casts = [
        'date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'check_in_latitude' => 'decimal:8',
        'check_in_longitude' => 'decimal:8',
        'check_out_latitude' => 'decimal:8',
        'check_out_longitude' => 'decimal:8',
        'gps_warning' => 'boolean',
        'distance_from_office' => 'integer',
        'gps_data' => 'array',
        'device_info' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Calculate work duration in minutes
    public function getWorkDurationAttribute()
    {
        if (!$this->check_in_time || !$this->check_out_time) {
            return null;
        }

        try {
            return $this->check_out_time->diffInMinutes($this->check_in_time);
        } catch (\Exception $e) {
            return null;
        }
    }

    // Check if late (after 8 AM)
    public function getIsLateAttribute()
    {
        if (!$this->check_in_time) {
            return false;
        }

        try {
            $standardTime = Carbon::createFromFormat('H:i:s', '08:00:00');
            return $this->check_in_time->format('H:i:s') > $standardTime->format('H:i:s');
        } catch (\Exception $e) {
            return false;
        }
    }

    // Get formatted working hours
    public function getFormattedWorkingHoursAttribute()
    {
        $duration = $this->work_duration;
        if (!$duration) {
            return '-';
        }

        $hours = floor($duration / 60);
        $minutes = $duration % 60;
        
        return sprintf('%d jam %d menit', $hours, $minutes);
    }
}