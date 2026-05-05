<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update users table to add new roles
        Schema::table('users', function (Blueprint $table) {
            // Add new roles to existing enum if not already present
            $table->dropColumn('role');
        });
        
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['administrator', 'engineer', 'sales_manager', 'sales'])->default('engineer')->after('password');
        });

        // Create customers table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users');
        });

        // Create plan_visits table
        Schema::create('plan_visits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->date('tanggal_visit');
            $table->string('lokasi');
            $table->text('keterangan')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable(); // Sales yang ditugaskan
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('customers');
            $table->foreign('assigned_to')->references('id')->on('users');
            $table->foreign('created_by')->references('id')->on('users');
        });

        // Create realisasi_visits table
        Schema::create('realisasi_visits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('plan_visit_id');
            $table->enum('status', ['pending', 'done', 'missed'])->default('pending');
            $table->datetime('visit_time')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->json('photos')->nullable(); // Array of photo paths
            $table->unsignedBigInteger('visited_by')->nullable();
            $table->timestamps();
            
            $table->foreign('plan_visit_id')->references('id')->on('plan_visits');
            $table->foreign('visited_by')->references('id')->on('users');
        });

        // Create attendance table
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->date('date');
            $table->timestamp('check_in_time')->nullable();
            $table->timestamp('check_out_time')->nullable();
            $table->decimal('check_in_latitude', 10, 8)->nullable();
            $table->decimal('check_in_longitude', 11, 8)->nullable();
            $table->decimal('check_out_latitude', 10, 8)->nullable();
            $table->decimal('check_out_longitude', 11, 8)->nullable();
            $table->string('check_in_photo')->nullable();
            $table->string('check_out_photo')->nullable();
            $table->boolean('gps_warning')->default(false);
            $table->decimal('distance_from_office', 8, 2)->nullable();
            $table->json('gps_data')->nullable();
            $table->json('device_info')->nullable();
            $table->enum('status', ['present', 'late', 'no_gps', 'outside_area', 'gps_warning'])->default('present');
            $table->integer('work_duration')->nullable(); // in minutes
            $table->boolean('is_late')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users');
            $table->unique(['user_id', 'date']);
        });

        // Create warnings table
        Schema::create('warnings', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['missed_visit', 'late_attendance', 'no_attendance']);
            $table->string('title');
            $table->text('message');
            $table->unsignedBigInteger('user_id'); // User yang mendapat warning
            $table->unsignedBigInteger('plan_visit_id')->nullable(); // Jika terkait visit
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('plan_visit_id')->references('id')->on('plan_visits');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warnings');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('realisasi_visits');
        Schema::dropIfExists('plan_visits');
        Schema::dropIfExists('customers');
        
        // Revert users table role enum
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
        
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['administrator', 'engineer'])->default('engineer')->after('password');
        });
    }
};