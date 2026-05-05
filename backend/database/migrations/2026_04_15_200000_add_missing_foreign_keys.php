<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add missing foreign key constraints for data integrity
        
        // Fix attendance table foreign keys
        if (Schema::hasTable('attendance') && !$this->foreignKeyExists('attendance', 'attendance_user_id_foreign')) {
            Schema::table('attendance', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
        
        // Fix plan_visits cascading delete issue - change to restrict to preserve audit trail
        if (Schema::hasTable('plan_visits') && $this->foreignKeyExists('plan_visits', 'plan_visits_created_by_foreign')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->dropForeign('plan_visits_created_by_foreign');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            });
        }
        
        // Fix realisasi_visits cascading delete issue
        if (Schema::hasTable('realisasi_visits') && $this->foreignKeyExists('realisasi_visits', 'realisasi_visits_visited_by_foreign')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->dropForeign('realisasi_visits_visited_by_foreign');
                $table->foreign('visited_by')->references('id')->on('users')->onDelete('restrict');
            });
        }
        
        // Add indexes for performance on frequently queried columns
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                if (!$this->indexExists('attendance', 'attendance_user_id_date_index')) {
                    $table->index(['user_id', 'date'], 'attendance_user_id_date_index');
                }
                if (!$this->indexExists('attendance', 'attendance_date_index')) {
                    $table->index('date');
                }
            });
        }
        
        if (Schema::hasTable('plan_visits')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                if (!$this->indexExists('plan_visits', 'plan_visits_assigned_to_index')) {
                    $table->index('assigned_to');
                }
                if (!$this->indexExists('plan_visits', 'plan_visits_tanggal_visit_index')) {
                    $table->index('tanggal_visit');
                }
                if (!$this->indexExists('plan_visits', 'plan_visits_status_index')) {
                    $table->index('status');
                }
            });
        }
        
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                if (!$this->indexExists('customers', 'customers_created_by_index')) {
                    $table->index('created_by');
                }
            });
        }
        
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                if (!$this->indexExists('projects', 'projects_project_manager_id_index')) {
                    $table->index('project_manager_id');
                }
                if (!$this->indexExists('projects', 'projects_status_index')) {
                    $table->index('status');
                }
            });
        }
    }

    public function down()
    {
        // Remove foreign keys
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }
        
        // Restore original cascading deletes
        if (Schema::hasTable('plan_visits')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
        
        if (Schema::hasTable('realisasi_visits')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->dropForeign(['visited_by']);
                $table->foreign('visited_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
        
        // Remove indexes
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                $table->dropIndex('attendance_user_id_date_index');
                $table->dropIndex(['date']);
            });
        }
        
        if (Schema::hasTable('plan_visits')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->dropIndex(['assigned_to']);
                $table->dropIndex(['tanggal_visit']);
                $table->dropIndex(['status']);
            });
        }
        
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropIndex(['created_by']);
            });
        }
        
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropIndex(['project_manager_id']);
                $table->dropIndex(['status']);
            });
        }
    }
    
    private function foreignKeyExists($table, $foreignKey)
    {
        try {
            $result = \DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND CONSTRAINT_NAME = ?
                AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            ", [$table, $foreignKey]);
            
            return count($result) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    private function indexExists($table, $index)
    {
        try {
            $result = \DB::select("
                SELECT INDEX_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND INDEX_NAME = ?
            ", [$table, $index]);
            
            return count($result) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
};