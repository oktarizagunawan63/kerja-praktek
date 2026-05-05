<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Projects table indexes
        Schema::table('projects', function (Blueprint $table) {
            $table->index('project_manager_id', 'idx_projects_pm_id');
            $table->index('status', 'idx_projects_status');
            $table->index('deleted_at', 'idx_projects_deleted');
            $table->index(['project_manager_id', 'status'], 'idx_projects_pm_status');
            $table->index(['status', 'deleted_at'], 'idx_projects_status_deleted');
        });

        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('is_active', 'idx_users_active');
            $table->index(['role', 'is_active'], 'idx_users_role_active');
            $table->index('status', 'idx_users_status');
        });

        // Customers table indexes
        Schema::table('customers', function (Blueprint $table) {
            $table->index('created_by', 'idx_customers_created_by');
            $table->index('approval_status', 'idx_customers_approval');
            $table->index(['created_by', 'approval_status'], 'idx_customers_created_approval');
        });

        // Plan visits table indexes
        Schema::table('plan_visits', function (Blueprint $table) {
            $table->index('assigned_to', 'idx_plan_visits_assigned');
            $table->index('created_by', 'idx_plan_visits_created');
            $table->index('tanggal_visit', 'idx_plan_visits_date');
            $table->index('status', 'idx_plan_visits_status');
            $table->index(['assigned_to', 'status'], 'idx_plan_visits_assigned_status');
            $table->index(['assigned_to', 'tanggal_visit'], 'idx_plan_visits_assigned_date');
        });

        // Realisasi visits table indexes
        Schema::table('realisasi_visits', function (Blueprint $table) {
            $table->index('visited_by', 'idx_realisasi_visited_by');
            $table->index('type', 'idx_realisasi_type');
            $table->index('approval_status', 'idx_realisasi_approval');
            $table->index('status', 'idx_realisasi_status');
            $table->index(['type', 'approval_status'], 'idx_realisasi_type_approval');
            $table->index(['visited_by', 'type'], 'idx_realisasi_visited_type');
        });

        // Attendance table indexes
        Schema::table('attendance', function (Blueprint $table) {
            $table->index('user_id', 'idx_attendance_user');
            $table->index('date', 'idx_attendance_date');
            $table->index(['user_id', 'date'], 'idx_attendance_user_date');
        });

        // Sales funnels table indexes
        Schema::table('sales_funnels', function (Blueprint $table) {
            $table->index('assigned_to', 'idx_funnels_assigned');
            $table->index('created_by', 'idx_funnels_created');
            $table->index('status', 'idx_funnels_status');
            $table->index(['assigned_to', 'status'], 'idx_funnels_assigned_status');
            $table->index(['created_by', 'status'], 'idx_funnels_created_status');
        });

        // Activity logs table indexes
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('user_id', 'idx_activity_user');
            $table->index('created_at', 'idx_activity_created');
        });

        // Warnings table indexes
        Schema::table('warnings', function (Blueprint $table) {
            $table->index('user_id', 'idx_warnings_user');
            $table->index('is_read', 'idx_warnings_read');
            $table->index(['user_id', 'is_read'], 'idx_warnings_user_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Projects table
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex('idx_projects_pm_id');
            $table->dropIndex('idx_projects_status');
            $table->dropIndex('idx_projects_deleted');
            $table->dropIndex('idx_projects_pm_status');
            $table->dropIndex('idx_projects_status_deleted');
        });

        // Users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_active');
            $table->dropIndex('idx_users_role_active');
            $table->dropIndex('idx_users_status');
        });

        // Customers table
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customers_created_by');
            $table->dropIndex('idx_customers_approval');
            $table->dropIndex('idx_customers_created_approval');
        });

        // Plan visits table
        Schema::table('plan_visits', function (Blueprint $table) {
            $table->dropIndex('idx_plan_visits_assigned');
            $table->dropIndex('idx_plan_visits_created');
            $table->dropIndex('idx_plan_visits_date');
            $table->dropIndex('idx_plan_visits_status');
            $table->dropIndex('idx_plan_visits_assigned_status');
            $table->dropIndex('idx_plan_visits_assigned_date');
        });

        // Realisasi visits table
        Schema::table('realisasi_visits', function (Blueprint $table) {
            $table->dropIndex('idx_realisasi_visited_by');
            $table->dropIndex('idx_realisasi_type');
            $table->dropIndex('idx_realisasi_approval');
            $table->dropIndex('idx_realisasi_status');
            $table->dropIndex('idx_realisasi_type_approval');
            $table->dropIndex('idx_realisasi_visited_type');
        });

        // Attendance table
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_user');
            $table->dropIndex('idx_attendance_date');
            $table->dropIndex('idx_attendance_user_date');
        });

        // Sales funnels table
        Schema::table('sales_funnels', function (Blueprint $table) {
            $table->dropIndex('idx_funnels_assigned');
            $table->dropIndex('idx_funnels_created');
            $table->dropIndex('idx_funnels_status');
            $table->dropIndex('idx_funnels_assigned_status');
            $table->dropIndex('idx_funnels_created_status');
        });

        // Activity logs table
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_activity_user');
            $table->dropIndex('idx_activity_created');
        });

        // Warnings table
        Schema::table('warnings', function (Blueprint $table) {
            $table->dropIndex('idx_warnings_user');
            $table->dropIndex('idx_warnings_read');
            $table->dropIndex('idx_warnings_user_read');
        });
    }
};
