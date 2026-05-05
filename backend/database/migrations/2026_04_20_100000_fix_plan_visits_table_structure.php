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
        // Check if table exists, if not create it
        if (!Schema::hasTable('plan_visits')) {
            Schema::create('plan_visits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained()->onDelete('cascade');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
                $table->date('tanggal_visit');
                $table->time('waktu_visit')->nullable();
                $table->text('lokasi');
                $table->text('tujuan');
                $table->text('catatan')->nullable();
                $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();
                
                $table->index(['tanggal_visit']);
                $table->index(['assigned_to']);
                $table->index(['status']);
            });
        } else {
            // Add missing columns if they don't exist
            Schema::table('plan_visits', function (Blueprint $table) {
                if (!Schema::hasColumn('plan_visits', 'waktu_visit')) {
                    $table->time('waktu_visit')->nullable()->after('tanggal_visit');
                }
                if (!Schema::hasColumn('plan_visits', 'tujuan')) {
                    $table->text('tujuan')->nullable()->after('lokasi');
                }
                if (!Schema::hasColumn('plan_visits', 'catatan')) {
                    $table->text('catatan')->nullable()->after('tujuan');
                }
                if (!Schema::hasColumn('plan_visits', 'status')) {
                    $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled')->after('catatan');
                }
                if (!Schema::hasColumn('plan_visits', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null')->after('status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_visits');
    }
};