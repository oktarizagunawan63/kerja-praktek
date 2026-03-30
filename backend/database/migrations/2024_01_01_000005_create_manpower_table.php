<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manpower', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('role');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->date('joined_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manpower');
    }
};
