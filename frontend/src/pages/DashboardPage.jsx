import { useEffect } from 'react'
import { TrendingUp, DollarSign, Package, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard from '../components/kpi/KpiCard'
import ProgressBar from '../components/kpi/ProgressBar'
import Badge from '../components/ui/Badge'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import { formatRupiah } from '../lib/formatRupiah'
import { filterProjectsByRole } from '../lib/permissions'

const statusMap = {
  on_track:  { label: 'On Track',  variant: 'success' },
  at_risk:   { label: 'At Risk',   variant: 'warning' },
  delayed:   { label: 'Delayed',   variant: 'danger' },
  completed: { label: 'Selesai',   variant: 'info' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, checkNotifications } = useAppStore()
  const { user } = useAuthStore()
  const { users } = useUserStore()
  const projects_visible = filterProjectsByRole(projects, user, users)

  useEffect(() => { checkNotifications() }, [projects])

  const active    = projects_visible.filter(p => p.status !== 'completed')
  const completed = projects_visible.filter(p => p.status === 'completed')
  const totalRab  = projects.reduce((s, p) => s + (p.rab || 0), 0)
  const totalReal = projects.reduce((s, p) => s + (p.realisasi || 0), 0)
  const avgProg   = active.length ? Math.round(active.reduce((s, p) => s + (p.progress || 0), 0) / active.length) : 0
  const delayed   = active.filter(p => p.status === 'delayed').length
  const nearDeadline = active.filter(p => {
    const d = Math.ceil((new Date(p.deadline) - new Date()) / 86400000)
    return d <= 30 && d > 0
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitoring proyek PT Amsar Prima Mandiri</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Proyek Aktif"
          value={active.length}
          subtitle={`${nearDeadline} mendekati deadline`}
          icon={<TrendingUp size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
          trend="up"
          trendLabel={`${projects.length} total proyek`}
        />
        <KpiCard
          title="Total RAB"
          value={formatRupiah(totalRab)}
          subtitle={`RAB Terealisasi: ${formatRupiah(totalReal)}`}
          icon={<DollarSign size={20} className="text-green-600" />}
          iconBg="bg-green-100"
          trend="neutral"
          trendLabel={totalRab ? `${Math.round((totalReal / totalRab) * 100)}% terealisasi` : '0% terealisasi'}
        />
        <KpiCard
          title="Avg Progress Aktif"
          value={`${avgProg}%`}
          subtitle={`${delayed} proyek delayed`}
          icon={<Package size={20} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
          trend={delayed > 0 ? 'down' : 'up'}
          trendLabel={delayed > 0 ? 'Perlu perhatian' : 'Berjalan baik'}
        />
        <KpiCard
          title="Proyek Selesai"
          value={completed.length}
          subtitle={`dari ${projects.length} total proyek`}
          icon={<Wrench size={20} className="text-purple-600" />}
          iconBg="bg-purple-100"
          trend="up"
          trendLabel="Kumulatif"
        />
      </div>

      {/* RAB Progress */}
      {active.length > 0 && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">RAB per Proyek</h3>
          {active.map((p, i) => {
            const colors = ['bg-blue-500','bg-green-500','bg-yellow-500','bg-purple-500','bg-red-400']
            return <ProgressBar key={p.id} label={`${p.name} (${formatRupiah(p.rab)})`} value={p.realisasi || 0} target={p.rab || 1} color={colors[i % colors.length]} />
          })}
        </div>
      )}

      {/* Status Proyek */}
      {active.length > 0 ? (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Proyek</h3>
          <div className="space-y-3">
            {active.map(p => (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">Deadline: {new Date(p.deadline).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 text-right">{p.progress || 0}%</p>
                  </div>
                  <Badge variant={statusMap[p.status]?.variant || 'default'}>{statusMap[p.status]?.label || p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-sm">Belum ada proyek aktif.{' '}
            <span className="text-[#0f4c81] cursor-pointer hover:underline" onClick={() => navigate('/projects')}>Tambah proyek</span>
          </p>
        </div>
      )}
    </div>
  )
}
