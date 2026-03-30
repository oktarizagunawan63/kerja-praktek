<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('location');
            $table->enum('status', ['on_track', 'at_risk', 'delayed', 'completed'])->default('on_track');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('budget', 15, 2)->default(0);
            $table->decimal('budget_realisasi', 15, 2)->default(0);
            $table->unsignedTinyInteger('progress')->default(0);
            $table->foreignId('project_manager_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
