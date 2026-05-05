<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('project_assignments')) {
            Schema::create('project_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('assigned_by')->constrained('users')->onDelete('cascade');
                $table->timestamp('assigned_at');
                $table->timestamps();
                
                $table->unique(['project_id', 'user_id']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('project_assignments');
    }
};