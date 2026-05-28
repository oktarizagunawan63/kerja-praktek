<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PerformanceProjectSeeder extends Seeder
{
    private const TOTAL_PROJECTS = 500;
    private const TEST_MARKER = '[PERF_TEST_500_PROJECTS]';

    public function run(): void
    {
        DB::transaction(function () {
            $users = $this->ensureUsers();
            $this->deleteExistingPerformanceProjects();

            $projects = [];
            $assignments = [];
            $now = Carbon::now();

            for ($i = 1; $i <= self::TOTAL_PROJECTS; $i++) {
                $statusScenario = $this->statusScenario($i);
                $progress = $this->progressFor($statusScenario, $i);
                $startDate = Carbon::create(2025, 1, 1)->addDays(($i * 5) % 520);
                $deadline = $this->deadlineFor($statusScenario, $startDate, $i, $now);
                $completedAt = $statusScenario === 'Selesai'
                    ? $startDate->copy()->addDays(min(max(7, $deadline->diffInDays($startDate) - ($i % 14)), max(7, $deadline->diffInDays($startDate))))->setTime(16, 0)
                    : null;
                $createdAt = $startDate->copy()->subDays(($i % 21) + 1)->setTime(8 + ($i % 9), ($i * 7) % 60);
                $updatedAt = $completedAt
                    ? $completedAt->copy()->addHours($i % 6)
                    : $createdAt->copy()->addDays(min($now->diffInDays($createdAt, false) > 0 ? 1 : $createdAt->diffInDays($now), ($i % 45) + 1));

                $client = $this->client($i);
                $category = $this->category($i);
                $priority = $this->priority($i);
                $manager = $this->managerFor($users, $i);
                $engineers = $this->engineersFor($users['engineers'], $i);
                $rab = $this->budget($i, $priority);
                $realization = $statusScenario === 'Selesai'
                    ? $rab
                    : (int) round($rab * min(0.95, max(0, $progress / 100 + (($i % 9) - 4) / 100)));

                $project = Project::create([
                    'name' => $this->projectName($category, $client, $i),
                    'description' => $this->description($client, $category, $priority, $statusScenario, $i),
                    'location' => $this->location($i),
                    'status' => $this->appStatusFor($statusScenario, $deadline, $now),
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $deadline->toDateString(),
                    'rab' => $rab,
                    'rab_realisasi' => $realization,
                    'rab_expenses' => $this->rabExpenses($realization, $updatedAt),
                    'progress' => $progress,
                    'project_manager_id' => $manager->id,
                    'pm_name' => $manager->name,
                    'pm_email' => $manager->email,
                    'completed_at' => $completedAt,
                    'assigned_engineers' => array_map(fn (User $engineer) => (string) $engineer->id, $engineers),
                    'created_by' => $this->creatorFor($users, $i)->id,
                    'site_manager_id' => $users['siteManagers'][$i % count($users['siteManagers'])]->id,
                    'user_id' => $this->creatorFor($users, $i)->id,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                ]);

                foreach ($engineers as $engineer) {
                    $assignments[] = [
                        'project_id' => $project->id,
                        'user_id' => $engineer->id,
                        'assigned_by' => $manager->id,
                        'assigned_at' => $createdAt->copy()->addHours(2),
                        'created_at' => $createdAt,
                        'updated_at' => $updatedAt,
                    ];
                }
            }

            foreach (array_chunk($assignments, 500) as $chunk) {
                ProjectAssignment::insert($chunk);
            }
        });

        echo "OK Created " . self::TOTAL_PROJECTS . " realistic performance test projects.\n";
        echo "OK Login: admin@ptamsar.co.id / password can see all projects.\n";
    }

    private function ensureUsers(): array
    {
        $admin = $this->requiredUser('Administrator', 'admin@ptamsar.co.id', 'administrator', 'Management');
        $salesManagers = [
            $this->requiredUser('Timothi Lois Suryanto', 'timothilois007@gmail.com', 'sales_manager'),
        ];
        $sales = [
            $this->requiredUser('Rama Atteriza', 'ramaatteriza17@gmail.com', 'sales'),
        ];
        $siteManagers = [
            $this->requiredUser('Oktariza Gunawan', 'oktarizagunawan63@gmail.com', 'site_manager'),
        ];
        $engineers = [
            $this->requiredUser('Muchtar Ali Anwar', 'starsszscor@gmail.com', 'engineer'),
        ];

        return compact('admin', 'salesManagers', 'sales', 'siteManagers', 'engineers');
    }

    private function requiredUser(string $name, string $email, string $role, ?string $division = null): User
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new \RuntimeException("User {$email} belum ada. Seeder performa hanya memakai user yang sudah tersedia.");
        }

        $user->forceFill([
            'name' => $name,
            'role' => $role,
            'division' => $division,
            'is_active' => true,
            'status' => 'approved',
            'approved_at' => $user->approved_at ?? now(),
        ])->save();

        return $user;
    }

    private function deleteExistingPerformanceProjects(): void
    {
        if (!Schema::hasTable('projects')) {
            return;
        }

        Project::withTrashed()
            ->where('description', 'like', '%' . self::TEST_MARKER . '%')
            ->forceDelete();
    }

    private function statusScenario(int $i): string
    {
        return match ($i % 20) {
            0, 1, 2 => 'Pending',
            3, 4, 5, 6, 7, 8, 9, 10 => 'On Progress',
            11, 12, 13 => 'Review',
            14, 15, 16, 17 => 'Selesai',
            default => 'Dibatalkan',
        };
    }

    private function progressFor(string $statusScenario, int $i): int
    {
        return match ($statusScenario) {
            'Pending' => $i % 11,
            'On Progress' => 20 + (($i * 7) % 61),
            'Review' => 80 + (($i * 5) % 16),
            'Selesai' => 100,
            default => ($i * 9) % 71,
        };
    }

    private function deadlineFor(string $statusScenario, Carbon $startDate, int $i, Carbon $now): Carbon
    {
        $durationDays = 30 + (($i * 11) % 240);
        $deadline = $startDate->copy()->addDays($durationDays);

        if (in_array($statusScenario, ['On Progress', 'Review'], true) && $i % 9 === 0) {
            if ($startDate->lte($now->copy()->subDays(45))) {
                return $now->copy()->subDays(3 + ($i % 30));
            }

            return $deadline;
        }

        if ($statusScenario === 'Dibatalkan' && $i % 4 === 0) {
            if ($startDate->lte($now->copy()->subDays(45))) {
                return $now->copy()->subDays(10 + ($i % 30));
            }

            return $deadline;
        }

        return $deadline;
    }

    private function appStatusFor(string $statusScenario, Carbon $deadline, Carbon $now): string
    {
        if ($statusScenario === 'Selesai') {
            return 'completed';
        }

        if ($statusScenario === 'Dibatalkan' || $deadline->lt($now)) {
            return 'delayed';
        }

        return $statusScenario === 'Review' ? 'at_risk' : 'on_track';
    }

    private function managerFor(array $users, int $i): User
    {
        if ($i % 5 === 0) {
            return $users['salesManagers'][$i % count($users['salesManagers'])];
        }

        return $users['siteManagers'][$i % count($users['siteManagers'])];
    }

    private function creatorFor(array $users, int $i): User
    {
        if ($i % 6 === 0) {
            return $users['sales'][$i % count($users['sales'])];
        }

        if ($i % 4 === 0) {
            return $users['salesManagers'][$i % count($users['salesManagers'])];
        }

        return $users['admin'];
    }

    private function engineersFor(array $engineers, int $i): array
    {
        $count = 1 + ($i % 3);
        $assigned = [];

        for ($j = 0; $j < $count; $j++) {
            $assigned[] = $engineers[($i + $j * 2) % count($engineers)];
        }

        return array_values(array_unique($assigned, SORT_REGULAR));
    }

    private function budget(int $i, string $priority): int
    {
        $base = match ($priority) {
            'High' => 2500000000,
            'Medium' => 750000000,
            default => 75000000,
        };

        if ($i % 37 === 0) {
            return 25000000 + ($i * 125000);
        }

        if ($i % 41 === 0) {
            return 18000000000 + ($i * 9500000);
        }

        return $base + (($i * 13750000) % ($priority === 'High' ? 12000000000 : 2200000000));
    }

    private function rabExpenses(int $realization, Carbon $updatedAt): array
    {
        if ($realization <= 0) {
            return [];
        }

        return [[
            'id' => 'seed-' . $updatedAt->format('YmdHis') . '-' . $realization,
            'mode' => 'set',
            'amount' => $realization,
            'total_after' => $realization,
            'note' => 'Initial realization generated for performance testing',
            'user_id' => null,
            'user_name' => 'Performance Seeder',
            'created_at' => $updatedAt->toIso8601String(),
        ]];
    }

    private function projectName(string $category, string $client, int $i): string
    {
        $sequence = str_pad((string) $i, 3, '0', STR_PAD_LEFT);
        return "PRF-{$sequence} {$category} {$client}";
    }

    private function description(string $client, string $category, string $priority, string $statusScenario, int $i): string
    {
        $scopes = [
            'survey lokasi, penyusunan RAB, instalasi perangkat, commissioning, dan training user',
            'pengadaan material, pekerjaan sipil ringan, instalasi sistem, integrasi, serta serah terima',
            'assessment kebutuhan, desain teknis, implementasi bertahap, quality control, dan dokumentasi akhir',
            'revitalisasi area layanan, pemasangan perangkat medis pendukung, testing, dan pendampingan operasional',
        ];

        return self::TEST_MARKER
            . " Client: {$client}. Kategori: {$category}. Prioritas: {$priority}. "
            . "Skenario status uji: {$statusScenario}. Lingkup pekerjaan: {$scopes[$i % count($scopes)]}. "
            . "Dataset ini dibuat untuk uji dashboard, pagination, search, filter tanggal, chart bulanan, update, delete, dan akses role.";
    }

    private function client(int $i): string
    {
        $clients = [
            'RS Mitra Sehat', 'PT Nusantara Medika', 'Klinik Prima Husada', 'RSIA Bunda Lestari',
            'Dinas Kesehatan Kota Bandung', 'RS Harapan Keluarga', 'PT Global Farma', 'Klinik Medika Utama',
            'RS Citra Mandiri', 'Laboratorium Bio Diagnostik', 'PT Sejahtera Teknologi Medis', 'RS Permata Timur',
            'Klinik Sentra Sehat', 'RS Pelita Kasih', 'PT Indo Healthcare', 'RSUD Bhakti Warga',
        ];

        return $clients[$i % count($clients)];
    }

    private function category(int $i): string
    {
        $categories = [
            'Instalasi Gas Medis', 'Renovasi Ruang Operasi', 'Maintenance Alat Kesehatan',
            'Pembangunan Klinik', 'Sistem Nurse Call', 'Instalasi HVAC Medis',
            'Ruang ICU dan Isolasi', 'Laboratorium Diagnostik', 'Kalibrasi Perangkat',
            'Pengadaan Infrastruktur Medis',
        ];

        return $categories[$i % count($categories)];
    }

    private function priority(int $i): string
    {
        return match ($i % 10) {
            0, 1 => 'High',
            2, 3, 4, 5 => 'Medium',
            default => 'Low',
        };
    }

    private function location(int $i): string
    {
        $locations = [
            'Jakarta Selatan, DKI Jakarta', 'Jakarta Pusat, DKI Jakarta', 'Bekasi, Jawa Barat',
            'Tangerang, Banten', 'Depok, Jawa Barat', 'Bogor, Jawa Barat', 'Bandung, Jawa Barat',
            'Semarang, Jawa Tengah', 'Yogyakarta, DI Yogyakarta', 'Surabaya, Jawa Timur',
            'Malang, Jawa Timur', 'Denpasar, Bali', 'Medan, Sumatera Utara', 'Makassar, Sulawesi Selatan',
            'Palembang, Sumatera Selatan', 'Balikpapan, Kalimantan Timur',
        ];

        return $locations[$i % count($locations)];
    }
}
