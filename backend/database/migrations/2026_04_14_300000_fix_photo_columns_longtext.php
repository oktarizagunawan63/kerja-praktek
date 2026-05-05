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
        Schema::table('attendances', function (Blueprint $table) {
            // Change photo columns to LONGTEXT to support base64 images
            $table->longText('check_in_photo')->nullable()->change();
            $table->longText('check_out_photo')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Revert back to string if needed
            $table->string('check_in_photo')->nullable()->change();
            $table->string('check_out_photo')->nullable()->change();
        });
    }
};