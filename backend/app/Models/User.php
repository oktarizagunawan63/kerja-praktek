<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Roles: project_manager | engineer | director
    protected $fillable = ['name', 'email', 'password', 'role', 'is_active'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function progressReports()
    {
        return $this->hasMany(ProgressReport::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }
}
