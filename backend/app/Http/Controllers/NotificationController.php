<?php

namespace App\Http\Controllers;

use App\Models\ProjectNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get notifications for current user (either project-based or user-specific welcome notifications)
        $notifs = ProjectNotification::with('project:id,name,pm_name,pm_email,end_date,progress', 'user:id,name')
            ->where(function($query) use ($user) {
                // User-specific notifications (like welcome)
                $query->where('user_id', $user->id)
                      // OR project notifications (existing logic)
                      ->orWhereNull('user_id');
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notifs->map(fn($n) => [
            'id'        => $n->id,
            'type'      => $n->type,
            'title'     => $n->title,
            'message'   => $n->message,
            'isRead'    => (bool)$n->is_read,
            'createdAt' => $n->created_at,
            'projectId' => $n->project_id,
            'userId'    => $n->user_id,
            'project'   => $n->project ? [
                'id'       => $n->project->id,
                'name'     => $n->project->name,
                'pm'       => $n->project->pm_name,
                'phone'    => $n->project->pm_email,
                'deadline' => $n->project->end_date,
                'progress' => $n->project->progress,
            ] : null,
            'user'      => $n->user ? [
                'id'   => $n->user->id,
                'name' => $n->user->name,
            ] : null,
        ]));
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();
        
        $count = ProjectNotification::where('is_read', false)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->count();
            
        return response()->json(['count' => $count]);
    }

    public function markRead(ProjectNotification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'OK']);
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();
        
        ProjectNotification::where('is_read', false)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereNull('user_id');
            })
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'OK']);
    }

    public function destroy(ProjectNotification $notification)
    {
        $notification->delete();
        return response()->json(['message' => 'Dihapus']);
    }

    public function clearAll()
    {
        ProjectNotification::truncate();
        return response()->json(['message' => 'Semua notifikasi dihapus']);
    }
}
