<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SimpleSeeder extends Seeder
{
    public function run(): void
    {
        echo "🌱 Starting simple database seeding...\n";

        // Clear existing data
        echo "Clearing existing data...\n";
        if (Schema::hasTable('projects')) {
            \DB::table('projects')->truncate();
        }
        if (Schema::hasTable('users')) {
            \DB::table('users')->truncate();
        }

        // === USERS ===
        echo "Creating users...\n";
        
        $admin = User::create([
            'name'      => 'Administrator',
            'email'     => 'admin@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'administrator',
            'is_active' => true,
            'status'    => 'approved',
            'phone'     => '021-12345678',
        ]);

        $siteManager = User::create([
            'name'      => 'Site Manager',
            'email'     => 'sitemanager@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'site_manager',
            'is_active' => true,
            'status'    => 'approved',
            'phone'     => '021-87654321',
        ]);

        $engineer = User::create([
            'name'      => 'Engineer',
            'email'     => 'engineer@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'engineer',
            'is_active' => true,
            'status'    => 'approved',
            'phone'     => '021-55667788',
        ]);

        $salesManager = User::create([
            'name'      => 'Sales Manager',
            'email'     => 'salesmanager@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'sales_manager',
            'is_active' => true,
            'status'    => 'approved',
            'phone'     => '021-11223344',
        ]);

        $sales = User::create([
            'name'      => 'Sales',
            'email'     => 'sales@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'sales',
            'is_active' => true,
            'status'    => 'approved',
            'phone'     => '021-44556677',
        ]);

        // === PROJECTS ===
        echo "Creating projects...\n";
        
        if (Schema::hasTable('projects')) {
            $project1 = Project::create([
                'name'               => 'RS Sentral Amsar',
                'location'           => 'Jakarta Selatan, DKI Jakarta',
                'status'             => 'on_track',
                'start_date'         => '2025-01-01',
                'end_date'           => '2026-09-30',
                'budget'             => 8500000000, // 8.5 miliar
                'budget_realisasi'   => 2550000000, // 2.55 miliar
                'progress'           => 30,
                'project_manager_id' => $siteManager->id,
                'pm_name'            => $siteManager->name,
                'pm_email'           => $siteManager->email,
            ]);

            $project2 = Project::create([
                'name'               => 'Klinik Utama Barat',
                'location'           => 'Jakarta Barat, DKI Jakarta',
                'status'             => 'at_risk',
                'start_date'         => '2025-02-01',
                'end_date'           => '2026-08-30',
                'budget'             => 4500000000, // 4.5 miliar
                'budget_realisasi'   => 675000000,  // 675 juta
                'progress'           => 15,
                'project_manager_id' => $siteManager->id,
                'pm_name'            => $siteManager->name,
                'pm_email'           => $siteManager->email,
            ]);

            $project3 = Project::create([
                'name'               => 'Lab Medis Timur',
                'location'           => 'Jakarta Timur, DKI Jakarta',
                'status'             => 'completed',
                'start_date'         => '2024-06-01',
                'end_date'           => '2025-12-31',
                'budget'             => 3200000000, // 3.2 miliar
                'budget_realisasi'   => 3200000000, // 3.2 miliar (completed)
                'progress'           => 100,
                'project_manager_id' => $siteManager->id,
                'pm_name'            => $siteManager->name,
                'pm_email'           => $siteManager->email,
                'completed_at'       => '2025-12-28',
            ]);

            echo "✅ Created 3 projects\n";
        } else {
            echo "⚠️ Projects table not found, skipping project creation\n";
        }

        echo "\n🎉 Simple database seeding completed successfully!\n";
        echo "\n📊 Summary:\n";
        echo "- Users: 5 records\n";
        echo "- Projects: " . (Schema::hasTable('projects') ? "3 records" : "0 (table not found)") . "\n";
        
        echo "\n🔑 Login Credentials:\n";
        echo "Administrator: admin@ptamsar.co.id / password\n";
        echo "Site Manager: sitemanager@ptamsar.co.id / password\n";
        echo "Engineer: engineer@ptamsar.co.id / password\n";
        echo "Sales Manager: salesmanager@ptamsar.co.id / password\n";
        echo "Sales: sales@ptamsar.co.id / password\n";
        echo "\n";
    }
}