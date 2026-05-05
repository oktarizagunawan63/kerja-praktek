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
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->after('project_manager_id');
            }
            if (!Schema::hasColumn('projects', 'site_manager_id')) {
                $table->foreignId('site_manager_id')->nullable()->constrained('users')->after('created_by');
            }
            if (!Schema::hasColumn('projects', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained('users')->after('site_manager_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['site_manager_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['created_by', 'site_manager_id', 'user_id']);
        });
    }
};