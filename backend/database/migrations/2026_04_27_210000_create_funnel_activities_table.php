<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funnel_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_id')->constrained('sales_funnels')->onDelete('cascade');
            
            $table->enum('activity_type', [
                'telepon', 
                'whatsapp', 
                'email', 
                'visit', 
                'meeting', 
                'demo', 
                'kirim_penawaran', 
                'revisi_penawaran', 
                'lainnya'
            ]);
            
            $table->dateTime('activity_date');
            $table->text('notes');
            
            // Stage tracking
            $table->enum('previous_stage', ['prospek', 'qualified', 'proposal', 'negosiasi', 'closing'])->nullable();
            $table->enum('new_stage', ['prospek', 'qualified', 'proposal', 'negosiasi', 'closing'])->nullable();
            
            // Probability tracking
            $table->enum('previous_probability', ['low', 'middle', 'high', 'very_high'])->nullable();
            $table->enum('new_probability', ['low', 'middle', 'high', 'very_high'])->nullable();
            
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Indexes
            $table->index('funnel_id');
            $table->index('activity_date');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funnel_activities');
    }
};
