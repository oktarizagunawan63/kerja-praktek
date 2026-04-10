import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Package, Wrench, Clock, Users, CheckCircle, XCircle } from 'lucide-react'
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
import { api } from '../lib/api'

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
  const [filterSM, setFilterSM] = useState('all') // filter per sales manager (administrator only)
  const [showWelcome, setShowWelcome] = useState(false)
  const [attendanceSummary, setAttendanceSummary] = useState(null)

  useEffect(() => { 
    checkNotifications()
    
    // Load attendance summary for Administrator
    if (user?.role === 'administrator' || user?.role === 'direktur') {
      loadAttendanceSummary()
      
      // Auto-refresh attendance data every 30 seconds
      const interval = setInterval(() => {
        loadAttendanceSummary()
      }, 30000)
      
      return () => clearInterval(interval)
    }
    
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

  const loadAttendanceSummary = async () => {
    try {
      const response = await api.getAttendanceSummary()
      if (response.success) {
        setAttendanceSummary(response.data)
      }
    } catch (error) {
      console.warn('Failed to load attendance summary:', error.message)
    }
  }

  const isNewUser = () => {
    if (!user) return false
    
    // Check if user has any assigned projects
    const userProjects = projects.filter(p => 
      p.pm?.toLowerCase() === user.name?.toLowerCase() ||
      (user.assignedProjects && user.assignedProjects.includes(p.id.toString()))
    )
    
    return userProjects.length === 0
  }

  // Site managers list untuk filter
  const siteManagers = users.filter(u => u.role === 'site_manager')

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
            <option value="all">Semua Site Manager</option>
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

      {/* Attendance Section - Administrator Only */}
      {(user?.role === 'administrator' || user?.role === 'direktur') && attendanceSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Stats */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Kehadiran Hari Ini</h3>
              <button 
                onClick={() => navigate('/attendance')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Lihat Detail
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-xs font-medium text-gray-600">Check In</span>
                </div>
                <p className="text-lg font-bold text-green-700">
                  {attendanceSummary.today_stats.checked_in}
                </p>
                <p className="text-xs text-gray-500">
                  dari {attendanceSummary.today_stats.total_employees} karyawan
                </p>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="text-blue-600" size={16} />
                  <span className="text-xs font-medium text-gray-600">Sedang Kerja</span>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  {attendanceSummary.today_stats.currently_working}
                </p>
                <p className="text-xs text-gray-500">
                  {attendanceSummary.today_stats.attendance_rate}% tingkat kehadiran
                </p>
              </div>
            </div>
            
            {/* Attendance Rate Progress */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Tingkat Kehadiran</span>
                <span>{attendanceSummary.today_stats.attendance_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${attendanceSummary.today_stats.attendance_rate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Recent Attendance Activities */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Aktivitas Terbaru</h3>
              <span className="text-xs text-gray-500">Real-time</span>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {attendanceSummary.latest_activities.length > 0 ? (
                attendanceSummary.latest_activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.check_out_time ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {activity.check_out_time ? (
                        <XCircle className="text-red-600" size={14} />
                      ) : (
                        <CheckCircle className="text-green-600" size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {activity.user_name} • {activity.check_out_time ? 'Check Out' : 'Check In'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.check_out_time || activity.check_in_time).toLocaleTimeString('id-ID')} • {new Date(activity.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Clock size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Belum ada aktivitas hari ini</p>
                </div>
              )}
            </div>
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
