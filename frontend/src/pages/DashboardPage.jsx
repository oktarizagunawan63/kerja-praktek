import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Package, Wrench, Bell, AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard from '../components/kpi/KpiCard'
import ProgressBar from '../components/kpi/ProgressBar'
import Badge from '../components/ui/Badge'
import WelcomeCard from '../components/ui/WelcomeCard'
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

const notificationTypeStyle = {
  over_budget:      { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100',    Icon: AlertTriangle },
  deadline_warning: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'border-yellow-100', Icon: Clock },
  success:          { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100',  Icon: CheckCircle },
  info:             { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100',   Icon: Info },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, checkNotifications, notifications, markNotifRead } = useAppStore()
  const { user } = useAuthStore()
  const { users } = useUserStore()
  const [filterSM, setFilterSM] = useState('all') // filter per sales manager (administrator only)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => { 
    checkNotifications()
    
    // Show welcome card for new users (created within last 24 hours)
    if (user?.created_at) {
      const createdAt = new Date(user.created_at)
      const now = new Date()
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60)
      
      // Show welcome for users created within last 24 hours
      if (hoursDiff <= 24) {
        setShowWelcome(true)
      }
    }
  }, [projects, user])

  const isNewUser = () => {
    if (!user) return false
    
    // Check if user has any assigned projects
    const userProjects = projects.filter(p => 
      p.pm?.toLowerCase() === user.name?.toLowerCase() ||
      (user.assignedProjects && user.assignedProjects.includes(p.id.toString()))
    )
    
    return userProjects.length === 0
  }

  // Sales managers list untuk filter
  const siteManagers = users.filter(u => u.role === 'sales_manager' || u.role === 'site_manager')

  const projects_visible = filterProjectsByRole(projects, user, users)

  // Kalau administrator filter per Sales Manager
  const projects_filtered = (user?.role === 'administrator' || user?.role === 'direktur') && filterSM !== 'all'
    ? projects_visible.filter(p => p.pm?.toLowerCase() === siteManagers.find(sm => sm.id === filterSM)?.name?.toLowerCase())
    : projects_visible

  const active    = projects_filtered.filter(p => p.status !== 'completed')
  const completed = projects_filtered.filter(p => p.status === 'completed')
  const totalRab  = projects_filtered.reduce((s, p) => s + (p.rab || 0), 0)
  const totalReal = projects_filtered.reduce((s, p) => s + (p.realisasi || 0), 0)
  const avgProg   = active.length ? Math.round(active.reduce((s, p) => s + (p.progress || 0), 0) / active.length) : 0
  const delayed   = active.filter(p => p.status === 'delayed').length
  const nearDeadline = active.filter(p => {
    const d = Math.ceil((new Date(p.deadline) - new Date()) / 86400000)
    return d <= 30 && d > 0
  }).length

  return (
    <div className="space-y-6">
      {/* Welcome Card for New Users */}
      {(showWelcome || isNewUser()) && (
        <WelcomeCard 
          user={user} 
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoring proyek PT Amsar Prima Mandiri</p>
        </div>
        {(user?.role === 'administrator' || user?.role === 'direktur') && siteManagers.length > 0 && (
          <select value={filterSM} onChange={e => setFilterSM(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="all">Semua Sales Manager</option>
            {siteManagers.map(sm => (
              <option key={sm.id} value={sm.id}>{sm.name}</option>
            ))}
          </select>
        )}
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

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Notifikasi Terbaru</h3>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            <button 
              onClick={() => navigate('/notifications')} 
              className="text-xs text-blue-600 hover:underline"
            >
              Lihat semua
            </button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map(n => {
              const style = notificationTypeStyle[n.type] || notificationTypeStyle.info
              const Icon = style.Icon
              const project = projects.find(p => String(p.id) === String(n.projectId))
              
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotifRead(n.id)
                    if (project) {
                      navigate(`/projects/${project.id}`)
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${style.bg} ${style.border} ${n.isRead ? 'opacity-60' : ''}`}
                >
                  <div className={`mt-0.5 shrink-0 ${style.icon}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                    {project && (
                      <p className="text-xs text-gray-400 mt-1">
                        {project.name} · {n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : '-'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
