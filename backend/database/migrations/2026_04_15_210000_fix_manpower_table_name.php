<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Check if old 'manpower' table exists and new 'manpowers' doesn't
        if (Schema::hasTable('manpower') && !Schema::hasTable('manpowers')) {
            // Rename the table to match the model
            Schema::rename('manpower', 'manpowers');
            echo "✅ Renamed 'manpower' table to 'manpowers'\n";
        } 
        // If 'manpowers' already exists, drop the old 'manpower' table
        elseif (Schema::hasTable('manpower') && Schema::hasTable('manpowers')) {
            Schema::dropIfExists('manpower');
            echo "✅ Dropped duplicate 'manpower' table\n";
        }
        // If neither exists, create the 'manpowers' table
        elseif (!Schema::hasTable('manpowers')) {
            Schema::create('manpowers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('role');
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->date('joined_date');
                $table->timestamps();
            });
            echo "✅ Created 'manpowers' table\n";
        }
    }

    public function down()
    {
        // Rename back to original name
        if (Schema::hasTable('manpowers')) {
            Schema::rename('manpowers', 'manpower');
        }
    }
};