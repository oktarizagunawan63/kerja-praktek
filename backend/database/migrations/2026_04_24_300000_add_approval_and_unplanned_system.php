<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix plan_visits data before modifying enum
        DB::statement("UPDATE `plan_visits` SET `status` = 'pending' WHERE `status` NOT IN ('draft', 'pending', 'completed', 'cancelled')");
        
        // Modify plan_visits status enum
        DB::statement("ALTER TABLE `plan_visits` MODIFY COLUMN `status` ENUM('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending'");
        
        // Add approval columns to customers
        if (!Schema::hasColumn('customers', 'approval_status')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('approved')->after('longitude');
            });
        }
        if (!Schema::hasColumn('customers', 'approved_by')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('approval_status');
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            });
        }
        if (!Schema::hasColumn('customers', 'approved_at')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            });
        }
        if (!Schema::hasColumn('customers', 'rejection_reason')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->text('rejection_reason')->nullable()->after('approved_at');
            });
        }
        
        // Add approval columns to plan_visits
        if (!Schema::hasColumn('plan_visits', 'approved_by')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('status');
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            });
        }
        if (!Schema::hasColumn('plan_visits', 'approved_at')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            });
        }
        if (!Schema::hasColumn('plan_visits', 'rejection_reason')) {
            Schema::table('plan_visits', function (Blueprint $table) {
                $table->text('rejection_reason')->nullable()->after('approved_at');
            });
        }
        
        // Make plan_visit_id nullable and add unplanned columns to realisasi_visits
        DB::statement("ALTER TABLE `realisasi_visits` MODIFY COLUMN `plan_visit_id` BIGINT UNSIGNED NULL");
        
        if (!Schema::hasColumn('realisasi_visits', 'type')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->enum('type', ['planned', 'unplanned'])->default('planned')->after('plan_visit_id');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'customer_id')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->unsignedBigInteger('customer_id')->nullable()->after('type');
                $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'visit_date')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->date('visit_date')->nullable()->after('customer_id');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'actual_duration')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->integer('actual_duration')->nullable()->after('visit_date');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'visit_purpose')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->text('visit_purpose')->nullable()->after('actual_duration');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'meeting_notes')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->text('meeting_notes')->nullable()->after('visit_purpose');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'visit_outcome')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->enum('visit_outcome', ['closed', 'follow_up', 'not_interested', 'rescheduled'])->nullable()->after('meeting_notes');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'deal_amount')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->decimal('deal_amount', 15, 2)->nullable()->after('visit_outcome');
            });
        }
        if (!Schema::hasColumn('realisasi_visits', 'deal_notes')) {
            Schema::table('realisasi_visits', function (Blueprint $table) {
                $table->text('deal_notes')->nullable()->after('deal_amount');
            });
        }
    }

    public function down(): void
    {
        // Remove approval columns from customers
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['approval_status', 'approved_by', 'approved_at', 'rejection_reason']);
        });
        
        // Remove approval columns from plan_visits
        Schema::table('plan_visits', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['approved_by', 'approved_at', 'rejection_reason']);
        });
        
        DB::statement("ALTER TABLE `plan_visits` MODIFY COLUMN `status` ENUM('draft', 'pending', 'completed', 'cancelled') DEFAULT 'pending'");
        
        // Remove unplanned columns from realisasi_visits
        Schema::table('realisasi_visits', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn([
                'type', 'customer_id', 'visit_date',
                'actual_duration', 'visit_purpose', 'meeting_notes',
                'visit_outcome', 'deal_amount', 'deal_notes'
            ]);
        });
        
        DB::statement("ALTER TABLE `realisasi_visits` MODIFY COLUMN `plan_visit_id` BIGINT UNSIGNED NOT NULL");
    }
};
