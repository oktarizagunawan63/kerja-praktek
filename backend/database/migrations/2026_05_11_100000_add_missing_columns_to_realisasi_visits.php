<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('realisasi_visits', function (Blueprint $table) {
            // Add missing columns for visit completion
            if (!Schema::hasColumn('realisasi_visits', 'hasil_visit')) {
                $table->text('hasil_visit')->nullable()->after('meeting_notes');
            }
            if (!Schema::hasColumn('realisasi_visits', 'catatan')) {
                $table->text('catatan')->nullable()->after('hasil_visit');
            }
            if (!Schema::hasColumn('realisasi_visits', 'visited_at')) {
                $table->timestamp('visited_at')->nullable()->after('visit_date');
            }
            if (!Schema::hasColumn('realisasi_visits', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null')->after('plan_visit_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('realisasi_visits', function (Blueprint $table) {
            $table->dropColumn(['hasil_visit', 'catatan', 'visited_at', 'customer_id']);
        });
    }
};
