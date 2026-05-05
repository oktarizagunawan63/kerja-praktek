<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add missing fields to attendances table (FIXED TABLE NAME)
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'check_in_photo')) {
                $table->string('check_in_photo')->nullable()->after('check_in_lng');
            }
            if (!Schema::hasColumn('attendances', 'check_out_photo')) {
                $table->string('check_out_photo')->nullable()->after('check_out_lng');
            }
            if (!Schema::hasColumn('attendances', 'gps_warning')) {
                $table->boolean('gps_warning')->default(false)->after('check_out_photo');
            }
            if (!Schema::hasColumn('attendances', 'distance_from_office')) {
                $table->integer('distance_from_office')->nullable()->after('gps_warning');
            }
            if (!Schema::hasColumn('attendances', 'gps_data')) {
                $table->json('gps_data')->nullable()->after('distance_from_office');
            }
            if (!Schema::hasColumn('attendances', 'device_info')) {
                $table->json('device_info')->nullable()->after('gps_data');
            }
            if (!Schema::hasColumn('attendances', 'status')) {
                $table->enum('status', ['present', 'late', 'absent', 'outside_area', 'gps_warning', 'no_gps'])->default('present')->after('device_info');
            }
        });

        // Create work_locations table
        if (!Schema::hasTable('work_locations')) {
            Schema::create('work_locations', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('address')->nullable();
                $table->decimal('latitude', 10, 8);
                $table->decimal('longitude', 11, 8);
                $table->integer('radius')->default(200); // meters
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Fix projects table - add rab_target field if not exists
        if (!Schema::hasColumn('projects', 'rab_target')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->decimal('rab_target', 15, 2)->default(0)->after('budget');
            });
        }

        // Rename budget to rab if needed for consistency
        if (Schema::hasColumn('projects', 'budget') && !Schema::hasColumn('projects', 'rab')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->renameColumn('budget', 'rab');
            });
        }

        if (Schema::hasColumn('projects', 'budget_realisasi') && !Schema::hasColumn('projects', 'rab_realisasi')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->renameColumn('budget_realisasi', 'rab_realisasi');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('work_locations');
        
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'check_in_photo', 'check_out_photo', 'gps_warning', 
                'distance_from_office', 'gps_data', 'device_info', 'status'
            ]);
        });

        // Revert project table changes
        if (Schema::hasColumn('projects', 'rab_target')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('rab_target');
            });
        }
    }
};