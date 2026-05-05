<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogger
{
    public static function log(User $user, string $action, string $detail = '', $projectId = null): void
    {
        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => $action,
            'description'=> $detail,
            'project_id' => $projectId,
            'ip_address' => request()->ip(),
        ]);
    }
}
