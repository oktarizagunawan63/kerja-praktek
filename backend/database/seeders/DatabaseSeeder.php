<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        if (Schema::hasTable('users')) {
            User::create([
                'name' => 'Administrator',
                'email' => 'admin@amsar.com',
                'password' => Hash::make('password'),
                'role' => 'direktur',
                'phone' => '081234567890',
                'is_approved' => true,
                'approved_at' => now(),
                'approved_by' => 1
            ]);

            echo "OK Admin user created\n";
        }

        // Create sample projects
        if (Schema::hasTable('projects')) {
            Project::create([
                'name' => 'RS Sentral Amsar',
                'location' => 'Jakarta Pusat',
                'budget' => 5000000000,
                'start_date' => '2024-01-01',
                'end_date' => '2024-12-31',
                'status' => 'in_progress'
            ]);

            Project::create([
                'name' => 'Klinik Amsar Bekasi',
                'location' => 'Bekasi',
                'budget' => 2000000000,
                'start_date' => '2024-03-01',
                'end_date' => '2024-09-30',
                'status' => 'planning'
            ]);

            echo "OK Sample projects created\n";
        }

        echo "OK Database seeding completed successfully!\n";
    }
}
