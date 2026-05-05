<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix existing role data
        DB::table('users')
            ->where('role', 'director')
            ->update(['role' => 'administrator']);
            
        DB::table('users')
            ->where('role', 'direktur')
            ->update(['role' => 'administrator']);
            
        DB::table('users')
            ->where('role', 'project_manager')
            ->update(['role' => 'sales_manager']);
            
        DB::table('users')
            ->where('role', 'site_manager')
            ->update(['role' => 'sales_manager']);
    }

    public function down(): void
    {
        // Rollback if needed
        DB::table('users')
            ->where('role', 'administrator')
            ->update(['role' => 'director']);
            
        DB::table('users')
            ->where('role', 'sales_manager')
            ->update(['role' => 'project_manager']);
    }
};