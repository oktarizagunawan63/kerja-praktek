<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Customer;
use App\Models\FunnelActivity;
use App\Models\PlanVisit;
use App\Models\RealisasiVisit;
use App\Models\SalesFunnel;
use App\Models\User;
use App\Models\Warning;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SalesPerformanceSeeder extends Seeder
{
    private const TEST_MARKER = '[SALES_PERF_TEST]';

    public function run(): void
    {
        DB::transaction(function () {
            $users = $this->requiredUsers();
            $this->deleteExistingSalesTestData();

            $customers = $this->seedCustomers($users);
            $this->seedPlanAndRealisasiVisits($users, $customers);
            $this->seedUnplannedVisits($users, $customers);
            $this->seedFunnels($users, $customers);
            $this->seedSalesAttendance($users);
        });

        echo "OK Created sales manager and sales test data.\n";
        echo "OK Sales Manager: timothilois007@gmail.com / existing password\n";
        echo "OK Sales: ramaatteriza17@gmail.com / existing password\n";
    }

    private function requiredUsers(): array
    {
        return [
            'admin' => $this->requiredUser('admin@ptamsar.co.id', 'administrator'),
            'salesManager' => $this->requiredUser('timothilois007@gmail.com', 'sales_manager'),
            'sales' => $this->requiredUser('ramaatteriza17@gmail.com', 'sales'),
        ];
    }

    private function requiredUser(string $email, string $role): User
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new \RuntimeException("User {$email} belum ada. Seeder sales hanya memakai user yang sudah tersedia.");
        }

        $user->forceFill([
            'role' => $role,
            'is_active' => true,
            'status' => 'approved',
            'approved_at' => $user->approved_at ?? now(),
        ])->save();

        return $user;
    }

    private function deleteExistingSalesTestData(): void
    {
        $testPlanIds = PlanVisit::where('keterangan', 'like', '%' . self::TEST_MARKER . '%')
            ->orWhere('tujuan', 'like', '%' . self::TEST_MARKER . '%')
            ->pluck('id');

        RealisasiVisit::whereIn('plan_visit_id', $testPlanIds)
            ->orWhere('notes', 'like', '%' . self::TEST_MARKER . '%')
            ->orWhere('visit_purpose', 'like', '%' . self::TEST_MARKER . '%')
            ->orWhere('meeting_notes', 'like', '%' . self::TEST_MARKER . '%')
            ->delete();

        Warning::whereIn('plan_visit_id', $testPlanIds)
            ->orWhere('message', 'like', '%' . self::TEST_MARKER . '%')
            ->delete();

        PlanVisit::whereIn('id', $testPlanIds)->delete();

        $testFunnelIds = SalesFunnel::where('initial_notes', 'like', '%' . self::TEST_MARKER . '%')->pluck('id');
        FunnelActivity::whereIn('funnel_id', $testFunnelIds)
            ->orWhere('notes', 'like', '%' . self::TEST_MARKER . '%')
            ->delete();
        SalesFunnel::whereIn('id', $testFunnelIds)->delete();

        Customer::where('address', 'like', '%' . self::TEST_MARKER . '%')->delete();
        if (Schema::hasColumn('attendances', 'notes')) {
            Attendance::where('notes', 'like', '%' . self::TEST_MARKER . '%')->delete();
        }
    }

    private function seedCustomers(array $users): array
    {
        $customers = [];
        $cities = [
            ['Jakarta Selatan', 'DKI Jakarta'],
            ['Jakarta Timur', 'DKI Jakarta'],
            ['Bekasi', 'Jawa Barat'],
            ['Tangerang', 'Banten'],
            ['Bandung', 'Jawa Barat'],
            ['Semarang', 'Jawa Tengah'],
            ['Surabaya', 'Jawa Timur'],
            ['Yogyakarta', 'DI Yogyakarta'],
            ['Medan', 'Sumatera Utara'],
            ['Makassar', 'Sulawesi Selatan'],
        ];
        $companies = [
            'RS Harapan Bunda',
            'Klinik Medika Sentosa',
            'RSUD Bhakti Warga',
            'PT Nusantara Healthcare',
            'RS Permata Keluarga',
            'Klinik Pratama Sehat',
            'RSIA Kasih Ibu',
            'Laboratorium Bio Medika',
            'PT Global Alkesindo',
            'Puskesmas Mandiri',
            'RS Citra Husada',
            'Klinik Utama Pelita',
        ];

        for ($i = 1; $i <= 100; $i++) {
            [$city, $province] = $cities[$i % count($cities)];
            $createdBy = $i % 5 === 0 ? $users['salesManager'] : $users['sales'];
            $approval = match ($i % 20) {
                0, 1, 2 => 'pending',
                3 => 'rejected',
                default => 'approved',
            };
            $createdAt = Carbon::create(2026, 1, 1)->addDays(($i * 4) % 150)->setTime(8 + ($i % 8), ($i * 11) % 60);

            $customers[] = Customer::create([
                'name' => 'PIC ' . $companies[$i % count($companies)] . ' ' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'company' => $companies[$i % count($companies)],
                'phone' => '08' . str_pad((string) (1200000000 + $i * 7919), 10, '0', STR_PAD_LEFT),
                'email' => 'customer' . str_pad((string) $i, 3, '0', STR_PAD_LEFT) . '@example.co.id',
                'address' => self::TEST_MARKER . " Jl. Kesehatan No. {$i}, {$city}, {$province}",
                'latitude' => -6.2 + (($i % 30) / 1000),
                'longitude' => 106.8 + (($i % 35) / 1000),
                'approval_status' => $approval,
                'approved_by' => $approval === 'approved' ? $users['salesManager']->id : null,
                'approved_at' => $approval === 'approved' ? $createdAt->copy()->addHours(3) : null,
                'rejection_reason' => $approval === 'rejected' ? 'Data kontak belum valid untuk kebutuhan testing approval.' : null,
                'created_by' => $createdBy->id,
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addHours(4),
            ]);
        }

        return $customers;
    }

    private function seedPlanAndRealisasiVisits(array $users, array $customers): void
    {
        $now = Carbon::now();
        $approvedCustomers = array_values(array_filter(
            $customers,
            fn (Customer $customer) => $customer->approval_status === 'approved'
        ));

        for ($i = 1; $i <= 180; $i++) {
            $customer = $approvedCustomers[$i % count($approvedCustomers)];
            $visitDate = Carbon::create(2026, 1, 5)->addDays(($i * 3) % 170);
            $hasRealization = $i % 10 < 7;
            $isMissed = $hasRealization && $i % 13 === 0;
            $planStatus = $hasRealization ? ($isMissed ? 'cancelled' : 'completed') : ($i % 8 === 0 ? 'pending' : 'approved');
            $createdAt = $visitDate->copy()->subDays(3 + ($i % 8))->setTime(9, ($i * 5) % 60);

            $plan = PlanVisit::create([
                'customer_id' => $customer->id,
                'tanggal_visit' => $visitDate->toDateString(),
                'waktu_visit' => sprintf('%02d:%02d:00', 9 + ($i % 7), ($i * 10) % 60),
                'lokasi' => str_replace(self::TEST_MARKER . ' ', '', $customer->address),
                'tujuan' => self::TEST_MARKER . ' Follow up kebutuhan gas medis, nurse call, dan pengadaan alat kesehatan.',
                'catatan' => 'Visit dibuat untuk tes dashboard sales, filter tanggal, pending visit, dan report.',
                'keterangan' => self::TEST_MARKER . ' Jadwal visit sales performance.',
                'status' => $planStatus,
                'assigned_to' => $users['sales']->id,
                'created_by' => $i % 4 === 0 ? $users['salesManager']->id : $users['sales']->id,
                'approved_by' => $planStatus !== 'pending' ? $users['salesManager']->id : null,
                'approved_at' => $planStatus !== 'pending' ? $createdAt->copy()->addHours(2) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays(1),
            ]);

            if (!$hasRealization) {
                if ($visitDate->lt($now) && $i % 3 === 0) {
                    $warningAt = $visitDate->copy()->addDay()->setTime(9, 15);
                    $this->seedMissedVisitWarning($users, $plan, $visitDate, $warningAt, false);
                }

                continue;
            }

            $visitTime = $visitDate->copy()->setTime(10 + ($i % 5), ($i * 7) % 60);
            RealisasiVisit::create([
                'type' => 'planned',
                'plan_visit_id' => $plan->id,
                'customer_id' => $customer->id,
                'visit_date' => $visitDate->toDateString(),
                'visited_at' => $visitTime,
                'visit_time' => $visitTime,
                'actual_duration' => 30 + (($i * 7) % 90),
                'status' => $isMissed ? 'missed' : 'done',
                'approval_status' => 'approved',
                'approved_by' => $users['salesManager']->id,
                'approved_at' => $visitTime->copy()->addHours(4),
                'visit_purpose' => self::TEST_MARKER . ' Realisasi planned visit untuk follow up peluang.',
                'meeting_notes' => self::TEST_MARKER . ($isMissed
                    ? ' Customer tidak tersedia di lokasi, perlu jadwal ulang.'
                    : ' Diskusi kebutuhan berjalan baik dan lanjut ke tahap penawaran.'),
                'hasil_visit' => $isMissed ? 'Visit tidak terlaksana' : 'Kebutuhan terkonfirmasi',
                'catatan' => 'Data dummy sales visit.',
                'visit_outcome' => $isMissed ? 'rescheduled' : (['follow_up', 'closed', 'not_interested'][$i % 3]),
                'deal_amount' => $isMissed ? null : 25000000 + (($i * 17500000) % 2500000000),
                'deal_notes' => $isMissed ? null : 'Potensi deal dari planned visit.',
                'notes' => self::TEST_MARKER . ' Realisasi visit planned.',
                'latitude' => $customer->latitude,
                'longitude' => $customer->longitude,
                'photos' => [],
                'visited_by' => $users['sales']->id,
                'created_at' => $visitTime,
                'updated_at' => $visitTime->copy()->addHours(2),
            ]);

            if ($isMissed && $visitDate->lt($now)) {
                $this->seedMissedVisitWarning($users, $plan, $visitDate, $visitTime, true);
            }
        }
    }

    private function seedMissedVisitWarning(array $users, PlanVisit $plan, Carbon $visitDate, Carbon $createdAt, bool $alreadyMarkedMissed): void
    {
        $payload = [
            'type' => 'missed_visit',
            'title' => 'Visit Terlewat',
            'message' => self::TEST_MARKER . ' Visit ke ' . ($plan->customer->name ?? 'customer')
                . ' pada ' . $visitDate->format('d/m/Y')
                . ($alreadyMarkedMissed ? ' sudah ditandai terlewat.' : ' melewati jadwal dan belum direalisasikan.'),
            'user_id' => $plan->assigned_to ?: $users['sales']->id,
            'is_read' => $alreadyMarkedMissed && $plan->id % 4 === 0,
            'created_at' => $createdAt->copy()->addHours(3),
            'updated_at' => $createdAt->copy()->addHours(4),
        ];

        if (Schema::hasColumn('warnings', 'plan_visit_id')) {
            $payload['plan_visit_id'] = $plan->id;
        }

        if (Schema::hasColumn('warnings', 'priority')) {
            $payload['priority'] = $alreadyMarkedMissed ? 'high' : 'medium';
        }

        if (Schema::hasColumn('warnings', 'status')) {
            $payload['status'] = $payload['is_read'] ? 'read' : 'unread';
        }

        Warning::create($payload);
    }

    private function seedUnplannedVisits(array $users, array $customers): void
    {
        $approvedCustomers = array_values(array_filter(
            $customers,
            fn (Customer $customer) => $customer->approval_status === 'approved'
        ));

        for ($i = 1; $i <= 30; $i++) {
            $customer = $approvedCustomers[($i * 3) % count($approvedCustomers)];
            $visitDate = Carbon::create(2026, 2, 1)->addDays(($i * 5) % 120);
            $approval = match ($i % 10) {
                0, 1, 2 => 'pending',
                3 => 'rejected',
                default => 'approved',
            };

            RealisasiVisit::create([
                'type' => 'unplanned',
                'plan_visit_id' => null,
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_company' => $customer->company,
                'customer_phone' => $customer->phone,
                'customer_address' => str_replace(self::TEST_MARKER . ' ', '', $customer->address),
                'visit_date' => $visitDate->toDateString(),
                'visited_at' => $visitDate->copy()->setTime(13, ($i * 3) % 60),
                'visit_time' => $visitDate->copy()->setTime(13, ($i * 3) % 60),
                'actual_duration' => 25 + (($i * 9) % 75),
                'status' => 'done',
                'approval_status' => $approval,
                'approved_by' => $approval === 'pending' ? null : $users['salesManager']->id,
                'approved_at' => $approval === 'pending' ? null : $visitDate->copy()->setTime(17, 0),
                'rejection_reason' => $approval === 'rejected' ? 'Unplanned visit perlu bukti tambahan.' : null,
                'visit_purpose' => self::TEST_MARKER . ' Visit spontan setelah customer meminta demo singkat.',
                'meeting_notes' => self::TEST_MARKER . ' Diskusi onsite terkait kebutuhan proyek baru.',
                'hasil_visit' => 'Follow up penawaran',
                'catatan' => 'Data dummy unplanned visit.',
                'visit_outcome' => ['follow_up', 'closed', 'rescheduled'][$i % 3],
                'deal_amount' => 15000000 + (($i * 23000000) % 900000000),
                'deal_notes' => 'Potensi order dari unplanned visit.',
                'notes' => self::TEST_MARKER . ' Realisasi unplanned visit.',
                'latitude' => $customer->latitude,
                'longitude' => $customer->longitude,
                'photos' => [],
                'visited_by' => $users['sales']->id,
                'created_at' => $visitDate,
                'updated_at' => $visitDate->copy()->addHours(2),
            ]);
        }
    }

    private function seedFunnels(array $users, array $customers): void
    {
        $approvedCustomers = array_values(array_filter(
            $customers,
            fn (Customer $customer) => $customer->approval_status === 'approved'
        ));
        $channels = ['kontraktor', 'subdist', 'rsud', 'rs_swasta', 'klinik', 'puskesmas'];
        $segments = ['sot', 'igvm', 'nursecall', 'umum'];
        $stages = ['prospek', 'qualified', 'proposal', 'negosiasi', 'closing'];
        $probabilities = [
            ['low', 25],
            ['middle', 50],
            ['high', 75],
            ['very_high', 90],
        ];

        for ($i = 1; $i <= 120; $i++) {
            $customer = $approvedCustomers[($i * 2) % count($approvedCustomers)];
            [$probability, $percentage] = $probabilities[$i % count($probabilities)];
            $createdAt = Carbon::create(2026, 1, 3)->addDays(($i * 4) % 145)->setTime(8 + ($i % 8), ($i * 13) % 60);
            $status = match ($i % 12) {
                0, 1 => 'won',
                2, 3 => 'lost',
                default => 'open',
            };
            $estimatedValue = 45000000 + (($i * 37500000) % 8500000000);
            $targetClose = $createdAt->copy()->addDays(20 + (($i * 7) % 100));
            $cityProvince = $this->cityProvinceFromAddress($customer->address);

            $funnel = SalesFunnel::create([
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_company' => $customer->company,
                'customer_phone' => $customer->phone,
                'customer_email' => $customer->email,
                'channel' => $channels[$i % count($channels)],
                'city' => $cityProvince[0],
                'province' => $cityProvince[1],
                'segment' => $segments[$i % count($segments)],
                'segment_custom' => $segments[$i % count($segments)] === 'umum' ? 'Pengadaan umum alat kesehatan' : null,
                'qty' => 1 + ($i % 12),
                'unit' => ['unit', 'set', 'pcs'][$i % 3],
                'estimated_value' => $estimatedValue,
                'deal_stage' => $status === 'won' ? 'closing' : $stages[$i % count($stages)],
                'deadline_date' => $targetClose->toDateString(),
                'target_close_date' => $targetClose->toDateString(),
                'win_probability' => $probability,
                'win_percentage' => $percentage,
                'competitor_name' => $i % 4 === 0 ? 'Kompetitor Medika ' . (($i % 7) + 1) : null,
                'competitor_notes' => $i % 4 === 0 ? 'Customer membandingkan harga dan SLA.' : null,
                'initial_notes' => self::TEST_MARKER . ' Funnel dummy untuk test pipeline sales, filter, stats, won/lost, dan pagination.',
                'status' => $status,
                'won_value' => $status === 'won' ? $estimatedValue : null,
                'won_reason_category' => $status === 'won' ? ['harga_kompetitif', 'relasi', 'spesifikasi', 'after_sales'][$i % 4] : null,
                'won_notes' => $status === 'won' ? 'Deal dimenangkan dari data dummy.' : null,
                'won_date' => $status === 'won' ? Carbon::now()->subDays($i % 20)->toDateString() : null,
                'lost_reason_category' => $status === 'lost' ? ['kalah_harga', 'kalah_spesifikasi', 'kalah_kompetitor', 'proyek_ditunda'][$i % 4] : null,
                'lost_competitor' => $status === 'lost' && $i % 4 === 2 ? 'Kompetitor Medika' : null,
                'lost_notes' => $status === 'lost' ? 'Deal kalah untuk variasi statistik.' : null,
                'lost_date' => $status === 'lost' ? Carbon::now()->subDays($i % 18)->toDateString() : null,
                'assigned_to' => $i % 6 === 0 ? $users['salesManager']->id : $users['sales']->id,
                'created_by' => $i % 6 === 0 ? $users['salesManager']->id : $users['sales']->id,
                'last_activity_at' => $createdAt->copy()->addDays($i % 12),
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays($i % 20),
            ]);

            $this->seedFunnelActivities($users, $funnel, $createdAt);
        }
    }

    private function seedFunnelActivities(array $users, SalesFunnel $funnel, Carbon $createdAt): void
    {
        $activityTypes = ['telepon', 'whatsapp', 'email', 'visit', 'meeting', 'demo', 'kirim_penawaran', 'revisi_penawaran'];
        $activityCount = 1 + ($funnel->id % 4);
        $stages = ['prospek', 'qualified', 'proposal', 'negosiasi', 'closing'];

        for ($j = 1; $j <= $activityCount; $j++) {
            $previousStage = $stages[max(0, ($j - 1) % count($stages))];
            $newStage = $stages[min(count($stages) - 1, $j % count($stages))];

            FunnelActivity::create([
                'funnel_id' => $funnel->id,
                'activity_type' => $activityTypes[($funnel->id + $j) % count($activityTypes)],
                'activity_date' => $createdAt->copy()->addDays($j * 2)->setTime(10 + ($j % 5), 15),
                'notes' => self::TEST_MARKER . " Aktivitas funnel {$j}: follow up customer dan update pipeline.",
                'previous_stage' => $previousStage,
                'new_stage' => $newStage,
                'previous_probability' => null,
                'new_probability' => null,
                'created_by' => $funnel->created_by ?: $users['sales']->id,
                'created_at' => $createdAt->copy()->addDays($j * 2),
                'updated_at' => $createdAt->copy()->addDays($j * 2),
            ]);
        }
    }

    private function seedSalesAttendance(array $users): void
    {
        $payload = [
            'check_in_time' => Carbon::today()->setTime(8, 3),
            'check_out_time' => null,
            'check_in_latitude' => -6.20000000,
            'check_in_longitude' => 106.81666667,
            'gps_warning' => false,
            'distance_from_office' => 35,
            'gps_data' => ['source' => 'sales-performance-seeder'],
            'device_info' => ['browser' => 'test'],
            'status' => 'present',
        ];

        if (Schema::hasColumn('attendances', 'notes')) {
            $payload['notes'] = self::TEST_MARKER . ' Attendance today for sales dashboard.';
        }

        Attendance::updateOrCreate(
            ['user_id' => $users['sales']->id, 'date' => Carbon::today()->toDateString()],
            $payload
        );
    }

    private function cityProvinceFromAddress(string $address): array
    {
        $parts = array_values(array_map('trim', explode(',', str_replace(self::TEST_MARKER, '', $address))));
        return [
            $parts[count($parts) - 2] ?? 'Jakarta Selatan',
            $parts[count($parts) - 1] ?? 'DKI Jakarta',
        ];
    }
}
