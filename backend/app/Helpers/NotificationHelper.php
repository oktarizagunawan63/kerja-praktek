<?php

namespace App\Helpers;

use App\Models\ProjectNotification;
use App\Models\User;
use App\Models\Project;

class NotificationHelper
{
    /**
     * Notify when a new project is created
     */
    public static function projectCreated($project, $createdBy)
    {
        // FIX 6: Only notify admin and site_manager (NOT sales or engineer)
        $usersToNotify = User::whereIn('role', ['administrator', 'site_manager'])->get();
        
        foreach ($usersToNotify as $user) {
            if ($user->id !== $createdBy->id) { // Don't notify the creator
                ProjectNotification::create([
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                    'type' => 'info',
                    'title' => 'Proyek Baru Dibuat',
                    'message' => "Proyek baru '{$project->name}' telah dibuat oleh {$createdBy->name}",
                    'is_read' => false,
                ]);
            }
        }
    }

    /**
     * Notify when an engineer is assigned to a project
     */
    public static function engineerAssigned($engineer, $project, $assignedBy)
    {
        ProjectNotification::create([
            'project_id' => $project->id,
            'user_id' => $engineer->id,
            'type' => 'info',
            'title' => 'Ditugaskan ke Proyek',
            'message' => "Anda telah ditugaskan ke proyek {$project->name} oleh {$assignedBy->name}",
            'is_read' => false,
        ]);
    }

    /**
     * Notify managers when project progress is updated
     */
    public static function progressUpdated($project, $engineer, $progress)
    {
        $managers = User::whereIn('role', ['site_manager', 'admin'])->get();
        
        foreach ($managers as $manager) {
            ProjectNotification::create([
                'project_id' => $project->id,
                'user_id' => $manager->id,
                'type' => 'milestone',
                'title' => 'Progress Diupdate',
                'message' => "{$engineer->name} mengupdate progress {$project->name} menjadi {$progress}%",
                'is_read' => false,
            ]);
        }
    }

    /**
     * Notify when project deadline is approaching
     */
    public static function deadlineApproaching($project)
    {
        $usersToNotify = User::whereIn('role', ['site_manager', 'admin'])->get();
        
        $daysLeft = now()->diffInDays($project->end_date, false);
        
        foreach ($usersToNotify as $user) {
            ProjectNotification::create([
                'project_id' => $project->id,
                'user_id' => $user->id,
                'type' => 'deadline_warning',
                'title' => 'Deadline Mendekat',
                'message' => "Proyek {$project->name} deadline dalam {$daysLeft} hari lagi",
                'is_read' => false,
            ]);
        }
    }

    /**
     * Notify when a new customer is added
     */
    public static function customerCreated($customer, $createdBy)
    {
        // FIX 6: Only notify sales_manager (NOT sales or other roles)
        $usersToNotify = User::where('role', 'sales_manager')->get();
        
        foreach ($usersToNotify as $user) {
            if ($user->id !== $createdBy->id) { // Don't notify the creator
                ProjectNotification::create([
                    'user_id' => $user->id,
                    'type' => 'info',
                    'title' => 'Customer Baru Ditambahkan',
                    'message' => "Customer baru '{$customer->name}' telah ditambahkan oleh {$createdBy->name}",
                    'is_read' => false,
                ]);
            }
        }
    }

    /**
     * Notify when a visit is assigned
     */
    public static function visitAssigned($visit, $assignedUser, $assignedBy)
    {
        // FIX 6: Only notify the assigned sales person
        ProjectNotification::create([
            'user_id' => $assignedUser->id,
            'type' => 'visit',
            'title' => 'Visit Baru Ditugaskan',
            'message' => "Anda telah ditugaskan untuk mengunjungi {$visit->customer->name} pada " . date('d/m/Y', strtotime($visit->tanggal_visit)),
            'is_read' => false,
        ]);
    }

    /**
     * Notify about attendance warning
     */
    public static function attendanceWarning($user, $message)
    {
        // FIX 6: Notify admin and sales_manager only (NOT sales or engineer)
        $usersToNotify = User::whereIn('role', ['administrator', 'sales_manager'])->get();
        
        foreach ($usersToNotify as $manager) {
            ProjectNotification::create([
                'user_id' => $manager->id,
                'type' => 'warning',
                'title' => 'Peringatan Kehadiran',
                'message' => "Peringatan kehadiran untuk {$user->name}: {$message}",
                'is_read' => false,
            ]);
        }
    }

    /**
     * Welcome notification for new users
     */
    public static function newUserCreated($user)
    {
        // FIX 6: Send welcome to new user + notify admin only
        ProjectNotification::create([
            'user_id' => $user->id,
            'type' => 'success',
            'title' => 'Selamat Datang!',
            'message' => 'Akun Anda telah berhasil dibuat. Selamat datang di sistem PT Amsar Prima Mandiri.',
            'is_read' => false,
        ]);
        
        // Notify admin about new user
        $admins = User::where('role', 'administrator')->get();
        foreach ($admins as $admin) {
            ProjectNotification::create([
                'user_id' => $admin->id,
                'type' => 'info',
                'title' => 'User Baru Terdaftar',
                'message' => "User baru '{$user->name}' dengan role {$user->role} telah terdaftar",
                'is_read' => false,
            ]);
        }
    }

    /**
     * Notify administrators about password reset events.
     */
    public static function passwordResetActivity($user, string $stage, ?string $ipAddress = null)
    {
        $admins = User::where('role', 'administrator')->get();
        $titles = [
            'requested' => 'Permintaan Reset Password',
            'completed' => 'Password Berhasil Direset',
        ];
        $messages = [
            'requested' => "User {$user->name} ({$user->email}) meminta reset password.",
            'completed' => "User {$user->name} ({$user->email}) berhasil mengganti password.",
        ];

        foreach ($admins as $admin) {
            ProjectNotification::create([
                'user_id' => $admin->id,
                'type' => 'warning',
                'title' => $titles[$stage] ?? 'Aktivitas Password',
                'message' => $messages[$stage] ?? "Ada aktivitas password dari {$user->name} ({$user->email}).",
                'is_read' => false,
                'metadata' => json_encode([
                    'subject_user_id' => $user->id,
                    'subject_name' => $user->name,
                    'subject_email' => $user->email,
                    'stage' => $stage,
                    'ip_address' => $ipAddress,
                    'happened_at' => now()->toISOString(),
                ]),
            ]);
        }
    }

    /**
     * Notify when a visit is completed
     */
    public static function visitCompleted($visit, $customer)
    {
        $managers = User::where('role', 'sales_manager')->get();
        
        foreach ($managers as $manager) {
            ProjectNotification::create([
                'user_id' => $manager->id,
                'type' => 'visit',
                'title' => 'Kunjungan Selesai',
                'message' => "Kunjungan ke {$customer->name} telah diselesaikan",
                'is_read' => false,
            ]);
        }
    }

    /**
     * Notify when project is over budget
     */
    public static function projectOverBudget($project)
    {
        $managers = User::whereIn('role', ['site_manager', 'sales_manager', 'administrator', 'admin'])->get();
        
        $overAmount = ($project->rab_realisasi ?? 0) - ($project->rab ?? 0);
        
        foreach ($managers as $manager) {
            ProjectNotification::create([
                'project_id' => $project->id,
                'user_id' => $manager->id,
                'type' => 'over_budget',
                'title' => 'Proyek Over Budget',
                'message' => "Proyek {$project->name} melebihi budget sebesar Rp " . number_format($overAmount, 0, ',', '.'),
                'is_read' => false,
            ]);
        }
    }

    /**
     * Notify when project is completed
     */
    public static function projectCompleted($project, $completedBy)
    {
        $usersToNotify = User::whereIn('role', ['site_manager', 'administrator', 'admin'])->get();
        
        foreach ($usersToNotify as $user) {
            if ($user->id !== $completedBy->id) { // Don't notify the person who completed it
                ProjectNotification::create([
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                    'type' => 'success',
                    'title' => 'Proyek Selesai',
                    'message' => "Proyek {$project->name} telah diselesaikan oleh {$completedBy->name}",
                    'is_read' => false,
                ]);
            }
        }
    }
}
