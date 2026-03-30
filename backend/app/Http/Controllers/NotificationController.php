<?php

namespace App\Http\Controllers;

use App\Models\ProjectNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        return response()->json(
            ProjectNotification::with('project:id,name')
                ->orderByDesc('created_at')
                ->paginate(20)
        );
    }

    public function markRead(ProjectNotification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'Ditandai dibaca']);
    }

    public function markAllRead()
    {
        ProjectNotification::where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'Semua notifikasi ditandai dibaca']);
    }

    public function unreadCount()
    {
        return response()->json([
            'count' => ProjectNotification::where('is_read', false)->count(),
        ]);
    }
}
