<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class Warning extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'user_id',
        'plan_visit_id',
        'is_read',
        'priority',
        'status',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function planVisit()
    {
        return $this->belongsTo(PlanVisit::class);
    }

    // Mark as read
    public function markAsRead()
    {
        $data = ['is_read' => true];

        if (Schema::hasColumn('warnings', 'status')) {
            $data['status'] = 'read';
        }

        $this->update($data);
    }

    // Create warning for missed visit
    public static function createMissedVisitWarning($planVisit)
    {
        return self::create([
            'type' => 'missed_visit',
            'title' => 'Visit Terlewat',
            'message' => "Visit ke {$planVisit->customer->name} pada {$planVisit->tanggal_visit->format('d/m/Y')} terlewat dan belum direalisasikan.",
            'user_id' => $planVisit->assigned_to,
            'plan_visit_id' => $planVisit->id,
        ]);
    }

    // Create warning for late attendance
    public static function createLateAttendanceWarning($user, $attendance)
    {
        return self::create([
            'type' => 'late_attendance',
            'title' => 'Terlambat Absen',
            'message' => "Absen masuk terlambat pada {$attendance->date->format('d/m/Y')} pukul {$attendance->check_in}.",
            'user_id' => $user->id,
        ]);
    }

    // Create warning for no attendance
    public static function createNoAttendanceWarning($user, $date)
    {
        return self::create([
            'type' => 'no_attendance',
            'title' => 'Tidak Absen',
            'message' => "Tidak melakukan absensi pada {$date->format('d/m/Y')}.",
            'user_id' => $user->id,
        ]);
    }
}
