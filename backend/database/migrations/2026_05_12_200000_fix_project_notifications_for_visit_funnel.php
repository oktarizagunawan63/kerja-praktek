<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_notifications', function (Blueprint $table) {
            // Make project_id nullable (notifications can be visit/funnel related, not just project)
            $table->dropForeign(['project_id']);
            $table->unsignedBigInteger('project_id')->nullable()->change();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();

            // Add user_id if not exists (who receives the notification)
            if (!Schema::hasColumn('project_notifications', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('project_id');
            }

            // Add metadata column if not exists
            if (!Schema::hasColumn('project_notifications', 'metadata')) {
                $table->text('metadata')->nullable()->after('is_read');
            }
        });

        DB::table('project_notifications')
            ->whereNotIn('type', [
                'over_budget',
                'deadline_warning',
                'success',
                'info',
                'visit',
                'funnel',
                'warning',
                'milestone',
            ])
            ->update(['type' => 'info']);

        // Update the type enum to support more notification types
        // Use raw SQL since Laravel doesn't support enum modification cleanly
        DB::statement("ALTER TABLE project_notifications MODIFY COLUMN type ENUM(
            'over_budget', 'deadline_warning', 'success', 'info',
            'visit', 'funnel', 'warning', 'milestone'
        ) NOT NULL DEFAULT 'info'");
    }

    public function down(): void
    {
        Schema::table('project_notifications', function (Blueprint $table) {
            if (Schema::hasColumn('project_notifications', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('project_notifications', 'metadata')) {
                $table->dropColumn('metadata');
            }
        });
    }
};
