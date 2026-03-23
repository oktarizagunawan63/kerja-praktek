import { TrendingUp, DollarSign, Package, Users } from 'lucide-react'
import KpiCard from '../components/kpi/KpiCard'
import ProgressBar from '../components/kpi/ProgressBar'
import TimelineChart from '../components/charts/TimelineChart'
import BudgetChart from '../components/charts/BudgetChart'
import ManpowerChart from '../components/charts/ManpowerChart'
import Badge from '../components/ui/Badge'

const PROJECTS = [
  { name: 'RS Sentral Amsar', status: 'on_track', progress: 72, deadline: '30 Sep 2026' },
  { name: 'Klinik Utama Barat', status: 'at_risk', progress: 45, deadline: '15 Jul 2026' },
  { name: 'Lab Medis Timur', status: 'on_track', progress: 88, deadline: '10 Jun 2026' },
  { name: 'Apotek Cabang 3', status: 'delayed', progress: 30, deadline: '01 Mei 2026' },
]

const statusMap = {
  on_track: { label: 'On Track', variant: 'success' },
  at_risk:  { label: 'At Risk',  variant: 'warning' },
  delayed:  { label: 'Delayed',  variant: 'danger' },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitoring proyek PT Amsar Medical Services</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Proyek Aktif"
          value="12"
          subtitle="4 mendekati deadline"
          icon={<TrendingUp size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
          trend="up"
          trendLabel="2 proyek baru bulan ini"
        />
        <KpiCard
          title="Total Anggaran"
          value="Rp 18,5M"
          subtitle="Realisasi: Rp 12,3M"
          icon={<DollarSign size={20} className="text-green-600" />}
          iconBg="bg-green-100"
          trend="neutral"
          trendLabel="66% terserap"
        />
        <KpiCard
          title="Material Tersedia"
          value="84%"
          subtitle="3 item stok kritis"
          icon={<Package size={20} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
          trend="down"
          trendLabel="Turun 5% dari minggu lalu"
        />
        <KpiCard
          title="Total Manpower"
          value="68 Orang"
          subtitle="Aktif di lapangan"
          icon={<Users size={20} className="text-purple-600" />}
          iconBg="bg-purple-100"
          trend="up"
          trendLabel="Naik 8 dari bulan lalu"
        />
      </div>

      {/* Budget Progress */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Budget per Proyek</h3>
        <ProgressBar label="RS Sentral Amsar"    value={720} target={850} color="bg-blue-500" />
        <ProgressBar label="Klinik Utama Barat"  value={410} target={400} color="bg-green-500" />
        <ProgressBar label="Lab Medis Timur"     value={280} target={300} color="bg-yellow-500" />
        <ProgressBar label="Apotek Cabang 3"     value={195} target={200} color="bg-purple-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimelineChart />
        <BudgetChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ManpowerChart />

        {/* Project Status Table */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Proyek</h3>
          <div className="space-y-3">
            {PROJECTS.map((p) => (
              <div key={p.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">Deadline: {p.deadline}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 text-right">{p.progress}%</p>
                  </div>
                  <Badge variant={statusMap[p.status].variant}>{statusMap[p.status].label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
