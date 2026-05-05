<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_notifications', function (Blueprint $table) {
            // Make project_id nullable for welcome notifications
            $table->foreignId('project_id')->nullable()->change();
            
            // Add user_id for welcome notifications
            $table->foreignId('user_id')->nullable()->after('project_id');
            
            // Update enum to include welcome type
            $table->dropColumn('type');
        });
        
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->enum('type', [
                'over_budget', 'deadline_warning', 'success', 'info', 
                'welcome', 'user', 'customer', 'visit', 'attendance', 
                'project', 'progress', 'deadline', 'budget'
            ])->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->dropColumn('user_id');
            $table->foreignId('project_id')->nullable(false)->change();
            $table->dropColumn('type');
        });
        
        Schema::table('project_notifications', function (Blueprint $table) {
            $table->enum('type', ['over_budget', 'deadline_warning', 'success', 'info'])->after('user_id');
        });
    }
};