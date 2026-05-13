import { useState, useEffect, useMemo, useRef } from 'react'
import { Users, Calendar, CheckSquare, Clock, TrendingUp, MapPin, Target, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { request } from '../lib/api'
import toast from 'react-hot-toast'

export default function SalesDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const isFetchingRef = useRef(false)

  const safeDashboardData = dashboardData || {}
  const stats = safeDashboardData.stats || {}
  const my_customers = Array.isArray(safeDashboardData.my_customers) ? safeDashboardData.my_customers : []
  const my_visits = Array.isArray(safeDashboardData.my_visits) ? safeDashboardData.my_visits : []
  const attendance_warning = Boolean(safeDashboardData.attendance_warning)

  const uniqueCustomers = useMemo(() => {
    return Array.from(new Map(my_customers.map((customer) => [customer.id, customer])).values())
  }, [my_customers])

  const uniqueVisits = useMemo(() => {
    return Array.from(new Map(my_visits.map((visit) => [visit.id, visit])).values())
  }, [my_visits])

  const statCards = [
    { label: 'My Customers', value: stats.my_customers || 0, icon: Users, color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Assigned Visits', value: stats.assigned_visits || 0, icon: Calendar, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Completed Visits', value: stats.completed_visits || 0, icon: CheckSquare, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'This Month Target', value: `${stats.monthly_completion || 0}%`, icon: Target, color: 'text-amber-700', bg: 'bg-amber-50' },
  ]

  const quickActions = [
    { label: 'My Customers', icon: Users, path: '/customers' },
    { label: 'Plan Visits', icon: Calendar, path: '/plan-visits' },
    { label: 'Complete Visit', icon: CheckSquare, path: '/realisasi-visits' },
    { label: 'Attendance', icon: Clock, path: '/attendance' },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setLoading(true)
      const response = await request('/dashboard/sales', { method: 'GET' })
      
      if (response.success) {
        setDashboardData(response.data)
      } else {
        toast.error('Gagal memuat data dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Gagal memuat data dashboard</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Sales Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Sales Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name}. Pantau customer, visit, dan performa bulan ini.</p>
          </div>
        </div>

        {attendance_warning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="text-amber-700" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Belum Absen Hari Ini</p>
                <p className="text-sm text-amber-800">Jangan lupa melakukan absensi sebelum memulai visit.</p>
              </div>
              <button
                onClick={() => navigate('/attendance')}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Absen Sekarang
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={color} size={22} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">My Customers</h2>
                <p className="text-sm text-slate-500">Customer terbaru yang terhubung ke akun sales.</p>
              </div>
              <button onClick={() => navigate('/customers')} className="text-sm font-semibold text-red-700 hover:text-red-800">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {uniqueCustomers.length > 0 ? (
                uniqueCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => navigate('/customers')}
                    className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    <p className="font-semibold text-slate-900">{customer.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{customer.company || '-'}</p>
                    <p className="mt-2 text-xs text-slate-500">{customer.phone || '-'}</p>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-2 text-slate-300" size={32} />
                  <p className="text-sm text-slate-500">Belum ada customer</p>
                  <button onClick={() => navigate('/customers')} className="mt-3 text-sm font-semibold text-red-700 hover:text-red-800">
                    Tambah Customer
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">My Assigned Visits</h2>
                <p className="text-sm text-slate-500">Visit terdekat yang perlu ditindaklanjuti.</p>
              </div>
              <button onClick={() => navigate('/plan-visits')} className="text-sm font-semibold text-red-700 hover:text-red-800">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {uniqueVisits.length > 0 ? (
                uniqueVisits.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => navigate('/plan-visits')}
                    className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <MapPin className="text-red-700" size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{visit.customer?.name || 'Unknown'}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">{visit.lokasi || '-'}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-red-700">
                            {new Date(visit.tanggal_visit).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            visit.status === 'scheduled' || visit.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                            visit.status === 'ongoing' ? 'bg-amber-50 text-amber-700' :
                            visit.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {visit.status === 'scheduled' || visit.status === 'approved' ? 'Direncanakan' :
                             visit.status === 'ongoing' ? 'Sedang Berjalan' :
                             visit.status === 'completed' ? 'Selesai' :
                             visit.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto mb-2 text-slate-300" size={32} />
                  <p className="text-sm text-slate-500">Belum ada visit yang ditugaskan</p>
                  <button onClick={() => navigate('/plan-visits')} className="mt-3 text-sm font-semibold text-red-700 hover:text-red-800">
                    Lihat Plan Visit
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="text-red-700" size={20} />
              <h2 className="text-base font-semibold text-slate-950">Performance This Month</h2>
            </div>

            <div className="space-y-4">
              {[
                ['Total Visits', stats.monthly_visits || 0, 'text-slate-900'],
                ['Completed', stats.monthly_completed || 0, 'text-emerald-700'],
                ['Missed', stats.monthly_missed || 0, 'text-red-700'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`font-semibold ${color}`}>{value}</span>
                </div>
              ))}

              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Completion Rate</span>
                  <span className="text-sm font-bold text-red-700">{stats.monthly_completion || 0}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2.5 rounded-full bg-red-600 transition-all duration-300"
                    style={{ width: `${Math.min(stats.monthly_completion || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">Quick Actions</h2>
            <p className="text-sm text-slate-500">Akses cepat ke pekerjaan harian sales.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-red-200 hover:bg-red-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <Icon className="text-red-700" size={20} />
                </span>
                <span className="text-sm font-semibold text-slate-800">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
