<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old enum column
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->dropColumn('type');
        });
        
        // Add the new enum column with all notification types
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->enum('type', [
                'over_budget', 
                'deadline_warning', 
                'success', 
                'info', 
                'welcome', 
                'user', 
                'customer', 
                'visit', 
                'attendance', 
                'project', 
                'progress', 
                'deadline', 
                'budget'
            ])->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->dropColumn('type');
        });
        
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->enum('type', ['over_budget', 'deadline_warning', 'success', 'info'])->after('user_id');
        });
    }
};
