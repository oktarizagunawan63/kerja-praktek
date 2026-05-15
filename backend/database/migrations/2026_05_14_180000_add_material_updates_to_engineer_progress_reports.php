<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('engineer_progress_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('engineer_progress_reports', 'material_updates')) {
                $table->text('material_updates')->nullable()->after('photo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('engineer_progress_reports', function (Blueprint $table) {
            if (Schema::hasColumn('engineer_progress_reports', 'material_updates')) {
                $table->dropColumn('material_updates');
            }
        });
    }
};
