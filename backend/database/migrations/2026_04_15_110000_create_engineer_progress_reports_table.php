<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('engineer_progress_reports')) {
            Schema::create('engineer_progress_reports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->integer('progress_percentage')->default(0);
                $table->text('notes')->nullable();
                $table->string('photo')->nullable();
                $table->timestamp('reported_at');
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('engineer_progress_reports');
    }
};