<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\Manpower;
use App\Models\Material;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        $director = User::create([
            'name'      => 'Direktur Utama',
            'email'     => 'direktur@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'director',
            'is_active' => true,
        ]);

        $pm1 = User::create([
            'name'      => 'Budi Santoso',
            'email'     => 'budi@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'project_manager',
            'is_active' => true,
        ]);

        $pm2 = User::create([
            'name'      => 'Siti Rahayu',
            'email'     => 'siti@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'project_manager',
            'is_active' => true,
        ]);

        $eng = User::create([
            'name'      => 'Ahmad Fauzi',
            'email'     => 'ahmad@ptamsar.co.id',
            'password'  => Hash::make('password'),
            'role'      => 'engineer',
            'is_active' => true,
        ]);

        // Projects
        $projects = [
            [
                'name'               => 'RS Sentral Amsar',
                'location'           => 'Jakarta Selatan',
                'status'             => 'on_track',
                'start_date'         => '2025-01-01',
                'end_date'           => '2026-09-30',
                'budget'             => 850000000,
                'budget_realisasi'   => 720000000,
                'progress'           => 72,
                'project_manager_id' => $pm1->id,
            ],
            [
                'name'               => 'Klinik Utama Barat',
                'location'           => 'Tangerang',
                'status'             => 'at_risk',
                'start_date'         => '2025-03-01',
                'end_date'           => '2026-07-15',
                'budget'             => 400000000,
                'budget_realisasi'   => 410000000,
                'progress'           => 45,
                'project_manager_id' => $pm2->id,
            ],
            [
                'name'               => 'Lab Medis Timur',
                'location'           => 'Bekasi',
                'status'             => 'on_track',
                'start_date'         => '2025-02-01',
                'end_date'           => '2026-06-10',
                'budget'             => 300000000,
                'budget_realisasi'   => 280000000,
                'progress'           => 88,
                'project_manager_id' => $pm1->id,
            ],
            [
                'name'               => 'Apotek Cabang 3',
                'location'           => 'Depok',
                'status'             => 'delayed',
                'start_date'         => '2025-04-01',
                'end_date'           => '2026-05-01',
                'budget'             => 200000000,
                'budget_realisasi'   => 195000000,
                'progress'           => 30,
                'project_manager_id' => $pm2->id,
            ],
        ];

        foreach ($projects as $pData) {
            $project = Project::create($pData);

            // Manpower
            $roles = ['Dokter', 'Perawat', 'Teknisi', 'Admin', 'Supervisor'];
            foreach ($roles as $role) {
                Manpower::create([
                    'project_id'  => $project->id,
                    'name'        => "Tenaga {$role} - {$project->name}",
                    'role'        => $role,
                    'status'      => 'active',
                    'joined_date' => $project->start_date,
                ]);
            }

            // Materials
            $materials = [
                ['name' => 'Beton K-300', 'unit' => 'm3', 'qty_plan' => 500, 'qty_used' => 350, 'qty_stock' => 150],
                ['name' => 'Besi Tulangan', 'unit' => 'ton', 'qty_plan' => 80, 'qty_used' => 60, 'qty_stock' => 20],
                ['name' => 'Kabel Listrik', 'unit' => 'm', 'qty_plan' => 2000, 'qty_used' => 1200, 'qty_stock' => 800],
            ];
            foreach ($materials as $mat) {
                Material::create(array_merge($mat, ['project_id' => $project->id]));
            }
        }
    }
}
