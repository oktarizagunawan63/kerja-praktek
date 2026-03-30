<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('progress_pct');
            $table->text('kendala')->nullable();
            $table->text('catatan')->nullable();
            $table->date('report_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_reports');
    }
};
