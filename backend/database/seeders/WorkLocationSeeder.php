<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WorkLocationSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Insert default work location for PT Amsar Prima Mandiri
        DB::table('work_locations')->insert([
            'name' => 'Kantor PT Amsar Prima Mandiri',
            'latitude' => -6.322155,
            'longitude' => 106.675579,
            'radius_meters' => 200,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        echo "✅ Default work location created: Kantor PT Amsar Prima Mandiri\n";
        echo "   Coordinates: -6.322155, 106.675579\n";
        echo "   Radius: 200 meters\n";
    }
}