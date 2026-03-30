<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogger
{
    public static function log(User $user, string $action, string $description = ''): void
    {
        ActivityLog::create([
            'user_id'     => $user->id,
            'action'      => $action,
            'description' => $description,
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
        ]);
    }
}
