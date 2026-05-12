<?php

namespace App\Http\Controllers;

use App\Models\ProjectNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifs = ProjectNotification::with('project:id,name,pm_name,pm_email,end_date,progress')
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
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
            'metadata'  => $n->metadata ? json_decode($n->metadata, true) : null,
            'project'   => $n->project ? [
                'id'       => $n->project->id,
                'name'     => $n->project->name,
                'pm'       => $n->project->pm_name,
                'phone'    => $n->project->pm_email,
                'deadline' => $n->project->end_date,
                'progress' => $n->project->progress,
            ] : null,
        ]));
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $count = ProjectNotification::where('is_read', false)
            ->where(function ($query) use ($user) {
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
            ->where(function ($query) use ($user) {
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

    public function clearAll(Request $request)
    {
        $user = $request->user();

        ProjectNotification::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhereNull('user_id');
        })->delete();

        return response()->json(['message' => 'Semua notifikasi dihapus']);
    }

    /**
     * Create a visit-related notification
     * Called internally from other controllers
     */
    public static function createVisitNotification(array $data)
    {
        try {
            ProjectNotification::create([
                'user_id'    => $data['user_id'] ?? null,
                'project_id' => $data['project_id'] ?? null,
                'type'       => $data['type'],
                'title'      => $data['title'],
                'message'    => $data['message'],
                'is_read'    => false,
                'metadata'   => isset($data['metadata']) ? json_encode($data['metadata']) : null,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create visit notification: ' . $e->getMessage());
        }
    }
}
