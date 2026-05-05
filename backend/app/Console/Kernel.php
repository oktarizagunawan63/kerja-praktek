<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\Project;
use App\Helpers\NotificationHelper;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Check for approaching deadlines daily at 8 AM
        $schedule->call(function () {
            $projects = Project::where('status', '!=', 'completed')
                ->whereDate('end_date', '<=', now()->addDays(7))
                ->whereDate('end_date', '>=', now())
                ->get();

            foreach ($projects as $project) {
                // Only send notification if progress is less than 80%
                if ($project->progress < 80) {
                    NotificationHelper::deadlineApproaching($project);
                }
            }
        })->dailyAt('08:00')->name('check-project-deadlines');

        // Check for over budget projects daily at 9 AM
        $schedule->call(function () {
            $projects = Project::where('status', '!=', 'completed')
                ->whereRaw('budget_realisasi > budget')
                ->get();

            foreach ($projects as $project) {
                NotificationHelper::projectOverBudget($project);
            }
        })->dailyAt('09:00')->name('check-over-budget-projects');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}