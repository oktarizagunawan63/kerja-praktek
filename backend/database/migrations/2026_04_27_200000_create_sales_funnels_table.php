<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_funnels', function (Blueprint $table) {
            $table->id();
            
            // Customer Information
            $table->string('customer_name');
            $table->string('customer_company');
            $table->string('customer_phone', 50)->nullable();
            $table->string('customer_email')->nullable();
            
            // Channel & Location
            $table->enum('channel', ['kontraktor', 'subdist', 'rsud', 'rs_swasta', 'klinik', 'puskesmas', 'lainnya']);
            $table->string('channel_other')->nullable();
            $table->string('city');
            $table->string('province')->nullable();
            
            // Product & Segment
            $table->enum('segment', ['sot', 'igvm', 'nursecall', 'umum']);
            $table->text('segment_custom')->nullable();
            $table->decimal('qty', 10, 2);
            $table->enum('unit', ['unit', 'set', 'pcs'])->default('unit');
            $table->decimal('estimated_value', 15, 2);
            
            // Pipeline
            $table->enum('deal_stage', ['prospek', 'qualified', 'proposal', 'negosiasi', 'closing'])->default('prospek');
            $table->date('deadline_date');
            $table->date('target_close_date');
            $table->enum('win_probability', ['low', 'middle', 'high', 'very_high'])->default('middle');
            $table->integer('win_percentage')->default(50);
            
            // Competitor
            $table->string('competitor_name')->nullable();
            $table->text('competitor_notes')->nullable();
            
            // Notes
            $table->text('initial_notes');
            
            // Status & Outcome
            $table->enum('status', ['open', 'won', 'lost'])->default('open');
            
            // Won Details
            $table->decimal('won_value', 15, 2)->nullable();
            $table->enum('won_reason_category', ['harga_kompetitif', 'relasi', 'spesifikasi', 'after_sales', 'pengiriman', 'lainnya'])->nullable();
            $table->text('won_notes')->nullable();
            $table->date('won_date')->nullable();
            
            // Lost Details
            $table->enum('lost_reason_category', ['kalah_harga', 'kalah_spesifikasi', 'kalah_kompetitor', 'budget_dipotong', 'proyek_ditunda', 'customer_batal', 'lainnya'])->nullable();
            $table->string('lost_competitor')->nullable();
            $table->text('lost_notes')->nullable();
            $table->date('lost_date')->nullable();
            
            // Assignment & Tracking
            $table->foreignId('assigned_to')->constrained('users')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('last_activity_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('deal_stage');
            $table->index('assigned_to');
            $table->index('created_by');
            $table->index('target_close_date');
            $table->index('last_activity_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_funnels');
    }
};
