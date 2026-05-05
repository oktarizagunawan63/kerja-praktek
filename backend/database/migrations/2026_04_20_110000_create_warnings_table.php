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
        if (!Schema::hasTable('warnings')) {
            Schema::create('warnings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('title');
                $table->text('message');
                $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
                $table->enum('status', ['unread', 'read'])->default('unread');
                $table->string('type')->nullable();
                $table->timestamps();
                
                $table->index(['user_id']);
                $table->index(['status']);
                $table->index(['priority']);
                $table->index(['created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warnings');
    }
};