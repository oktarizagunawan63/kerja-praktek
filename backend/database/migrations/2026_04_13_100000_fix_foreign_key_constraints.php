<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add missing foreign key constraints to ensure data integrity
        
        // Fix customers table
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                // Check if foreign key doesn't exist before adding
                if (!$this->foreignKeyExists('customers', 'customers_created_by_foreign')) {
                    $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                }
            });
        }

        // Fix plan_visits table
        if (Schema::hasTable('plan_visits')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                if (!$this->foreignKeyExists('plan_visits', 'plan_visits_customer_id_foreign')) {
                    $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
                }
                if (!$this->foreignKeyExists('plan_visits', 'plan_visits_assigned_to_foreign')) {
                    $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
                }
                if (!$this->foreignKeyExists('plan_visits', 'plan_visits_created_by_foreign')) {
                    $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                }
            });
        }

        // Fix realisasi_visits table
        if (Schema::hasTable('realisasi_visits')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                if (!$this->foreignKeyExists('realisasi_visits', 'realisasi_visits_plan_visit_id_foreign')) {
                    $table->foreign('plan_visit_id')->references('id')->on('plan_visits')->onDelete('cascade');
                }
                if (!$this->foreignKeyExists('realisasi_visits', 'realisasi_visits_visited_by_foreign')) {
                    $table->foreign('visited_by')->references('id')->on('users')->onDelete('set null');
                }
            });
        }

        // Fix attendance table
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                if (!$this->foreignKeyExists('attendance', 'attendance_user_id_foreign')) {
                    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                }
            });
        }

        // Fix warnings table
        if (Schema::hasTable('warnings')) {
            Schema::table('warnings', function (Blueprint $table) {
                if (!$this->foreignKeyExists('warnings', 'warnings_user_id_foreign')) {
                    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                }
                if (!$this->foreignKeyExists('warnings', 'warnings_plan_visit_id_foreign')) {
                    $table->foreign('plan_visit_id')->references('id')->on('plan_visits')->onDelete('cascade');
                }
            });
        }
    }

    public function down(): void
    {
        // Remove the foreign key constraints
        
        if (Schema::hasTable('warnings')) {
            Schema::table('warnings', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropForeign(['plan_visit_id']);
            });
        }

        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }

        if (Schema::hasTable('realisasi_visits')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->dropForeign(['plan_visit_id']);
                $table->dropForeign(['visited_by']);
            });
        }

        if (Schema::hasTable('plan_visits')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->dropForeign(['customer_id']);
                $table->dropForeign(['assigned_to']);
                $table->dropForeign(['created_by']);
            });
        }

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
            });
        }
    }

    /**
     * Check if a foreign key constraint exists
     */
    private function foreignKeyExists(string $table, string $foreignKey): bool
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
};