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
        Schema::table('realisasi_visits', function (Blueprint $table) {
            // Add type column for planned/unplanned distinction
            if (!Schema::hasColumn('realisasi_visits', 'type')) {
                $table->enum('type', ['planned', 'unplanned'])->default('planned')->after('id');
            }
            
            // Add customer fields for unplanned visits (when customer doesn't exist in customers table)
            if (!Schema::hasColumn('realisasi_visits', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('realisasi_visits', 'customer_company')) {
                $table->string('customer_company')->nullable()->after('customer_name');
            }
            if (!Schema::hasColumn('realisasi_visits', 'customer_phone')) {
                $table->string('customer_phone')->nullable()->after('customer_company');
            }
            if (!Schema::hasColumn('realisasi_visits', 'customer_address')) {
                $table->text('customer_address')->nullable()->after('customer_phone');
            }
            
            // Add visit details for unplanned visits
            if (!Schema::hasColumn('realisasi_visits', 'visit_date')) {
                $table->date('visit_date')->nullable()->after('customer_address');
            }
            if (!Schema::hasColumn('realisasi_visits', 'visit_purpose')) {
                $table->text('visit_purpose')->nullable()->after('visit_time');
            }
            if (!Schema::hasColumn('realisasi_visits', 'meeting_notes')) {
                $table->text('meeting_notes')->nullable()->after('visit_purpose');
            }
            if (!Schema::hasColumn('realisasi_visits', 'visit_outcome')) {
                $table->enum('visit_outcome', ['closed', 'follow_up', 'not_interested', 'rescheduled'])->nullable()->after('meeting_notes');
            }
            if (!Schema::hasColumn('realisasi_visits', 'deal_amount')) {
                $table->decimal('deal_amount', 15, 2)->nullable()->after('visit_outcome');
            }
            if (!Schema::hasColumn('realisasi_visits', 'deal_notes')) {
                $table->text('deal_notes')->nullable()->after('deal_amount');
            }
            
            // Add approval system for unplanned visits
            if (!Schema::hasColumn('realisasi_visits', 'approval_status')) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('approved')->after('status');
            }
            if (!Schema::hasColumn('realisasi_visits', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null')->after('approval_status');
            }
            if (!Schema::hasColumn('realisasi_visits', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('realisasi_visits', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('approved_at');
            }
            
            // Make plan_visit_id nullable for unplanned visits
            $table->unsignedBigInteger('plan_visit_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('realisasi_visits', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'customer_name',
                'customer_company',
                'customer_phone',
                'customer_address',
                'visit_date',
                'visit_purpose',
                'meeting_notes',
                'visit_outcome',
                'deal_amount',
                'deal_notes',
                'approval_status',
                'approved_by',
                'approved_at',
                'rejection_reason'
            ]);
        });
    }
};
