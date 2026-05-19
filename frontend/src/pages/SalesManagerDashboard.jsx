import { useState, useEffect, useMemo, useRef } from 'react'
import { Users, Calendar, CheckSquare, TrendingUp, AlertTriangle, MapPin, Clock, CheckCircle, XCircle } from '@icons'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const VISIT_OUTCOME_LABELS = {
  closed: 'Closed / Deal',
  follow_up: 'Follow-up',
  not_interested: 'Tidak Tertarik',
  rescheduled: 'Dijadwal Ulang',
}

export default function SalesManagerDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    total_customers: 0,
    total_plan_visits: 0,
    completed_visits: 0,
    total_sales: 0
  })
  const [recentCustomers, setRecentCustomers] = useState([])
  const [recentVisits, setRecentVisits] = useState([])
  const [warnings, setWarnings] = useState([])
  const [pendingUnplannedVisits, setPendingUnplannedVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingVisitIds, setProcessingVisitIds] = useState(new Set())
  const isLoadingRef = useRef(false)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh data every 60 seconds
    const interval = setInterval(() => {
      loadDashboardData({ silent: true })
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async ({ silent = false } = {}) => {
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      if (!silent) setLoading(true)
      
      // Load sales-manager dashboard data directly from the DB-backed endpoint.
      try {
        const dashboardResponse = await api.getSalesManagerDashboard()
        const dashboardData = dashboardResponse.data || {}

        setStats({
          total_customers: dashboardData.customers?.total || 0,
          total_plan_visits: dashboardData.visits?.total || 0,
          completed_visits: dashboardData.visits?.completed || 0,
          total_sales: dashboardData.team?.sales_count || 0,
          completion_rate: dashboardData.visits?.completion_rate || 0,
          visits_this_month: dashboardData.visits?.this_month || 0,
          active_warnings: dashboardData.warnings?.active_count || 0
        })
        setRecentCustomers(dashboardData.recent_customers || [])
        setRecentVisits(dashboardData.upcoming_visits || [])
      } catch (error) {
        console.warn('Sales manager dashboard API failed:', error.message)
        setStats({
          total_customers: 0,
          total_plan_visits: 0,
          completed_visits: 0,
          total_sales: 0,
          completion_rate: 0,
          visits_this_month: 0,
          active_warnings: 0
        })
        setRecentCustomers([])
        setRecentVisits([])
      }
      
      // Load recent warnings with fallback
      try {
        const warningsResponse = await api.getWarnings({ limit: 2 })
        const warningsData = warningsResponse.data?.data || warningsResponse.data || []
        setWarnings(warningsData)
      } catch (error) {
        console.warn('Warnings API failed:', error.message)
        setWarnings([])
      }

      // Load pending unplanned visits
      try {
        const response = await api.getPendingUnplannedVisits()
        setPendingUnplannedVisits(response.data || [])
      } catch (error) {
        console.warn('Pending unplanned visits failed:', error.message)
        setPendingUnplannedVisits([])
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }

  const handleApproveUnplanned = async (visitId) => {
    if (processingVisitIds.has(visitId)) return

    try {
      setProcessingVisitIds(prev => new Set(prev).add(visitId))
      await api.approveUnplannedVisit(visitId)
      toast.success('Unplanned visit approved')
      await loadDashboardData({ silent: true })
    } catch (error) {
      toast.error('Failed to approve: ' + error.message)
    } finally {
      setProcessingVisitIds(prev => {
        const next = new Set(prev)
        next.delete(visitId)
        return next
      })
    }
  }

  const handleRejectUnplanned = async (visitId) => {
    if (processingVisitIds.has(visitId)) return

    const reason = prompt('Enter rejection reason (min 10 characters):')
    if (!reason || reason.length < 10) {
      toast.error('Rejection reason minimal 10 karakter')
      return
    }

    try {
      setProcessingVisitIds(prev => new Set(prev).add(visitId))
      await api.rejectUnplannedVisit(visitId, reason)
      toast.success('Unplanned visit rejected')
      await loadDashboardData({ silent: true })
    } catch (error) {
      toast.error('Failed to reject: ' + error.message)
    } finally {
      setProcessingVisitIds(prev => {
        const next = new Set(prev)
        next.delete(visitId)
        return next
      })
    }
  }

  const uniqueRecentCustomers = useMemo(() => {
    return Array.from(new Map((recentCustomers || []).map((customer) => [customer.id, customer])).values())
  }, [recentCustomers])

  const uniqueRecentVisits = useMemo(() => {
    return Array.from(new Map((recentVisits || []).map((visit) => [visit.id, visit])).values())
  }, [recentVisits])

  const uniqueWarnings = useMemo(() => {
    return Array.from(new Map((warnings || []).map((warning) => [warning.id, warning])).values())
  }, [warnings])

  const uniquePendingUnplannedVisits = useMemo(() => {
    return Array.from(new Map((pendingUnplannedVisits || []).map((visit) => [visit.id, visit])).values())
  }, [pendingUnplannedVisits])

  const statCards = [
    { label: 'Total Customer', value: stats.total_customers || 0, icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Plan Visit', value: stats.total_plan_visits || 0, icon: Calendar, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Visit Terealisasi', value: stats.completed_visits || 0, icon: CheckSquare, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Sales Aktif', value: stats.total_sales || 0, icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-50' },
  ]

  const quickActions = [
    { label: 'Kelola Customer', icon: Users, path: '/customers' },
    { label: 'Kelola Plan Visit', icon: Calendar, path: '/plan-visits' },
    { label: 'Lihat Report', icon: TrendingUp, path: '/visit-reports' },
    { label: 'Cek Warning', icon: AlertTriangle, path: '/warnings' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Sales Management</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Sales Manager Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Halo, {user?.name}. Prioritaskan approval, warning, dan visit team yang perlu tindak lanjut.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
              <p className="text-sm font-medium text-emerald-700">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
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

            {(uniquePendingUnplannedVisits.length > 0 || uniqueWarnings.length > 0) && (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-emerald-950">Prioritas Hari Ini</h2>
                    <p className="text-sm text-emerald-800">Selesaikan approval dan warning agar report team tetap rapi.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => window.location.href = '/realisasi-visits'} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100">
                      {uniquePendingUnplannedVisits.length} approval
                    </button>
                    <button onClick={() => window.location.href = '/warnings'} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50">
                      {uniqueWarnings.length} warning
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Customer Terbaru</h2>
                    <p className="text-sm text-slate-500">Customer terbaru dari sales manager dan team.</p>
                  </div>
                  <button onClick={() => window.location.href = '/customers'} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {uniqueRecentCustomers.length > 0 ? uniqueRecentCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                          <Users className="text-emerald-700" size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                          <p className="truncate text-sm text-slate-600">{customer.company || customer.name}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-500">{customer.phone || '-'}</p>
                        <p className="mt-1 text-xs font-medium text-emerald-700">{customer.created_by || customer.address || '-'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-sm text-slate-500">No customers yet</div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Plan Visit Terdekat</h2>
                    <p className="text-sm text-slate-500">Agenda visit terdekat dari team sales.</p>
                  </div>
                  <button onClick={() => window.location.href = '/plan-visits'} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {uniqueRecentVisits.length > 0 ? uniqueRecentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <MapPin className="text-blue-700" size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{visit.customer_name || visit.customer?.name || 'Unknown Customer'}</p>
                          <p className="truncate text-sm text-slate-600">{visit.lokasi || '-'}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-blue-700">{new Date(visit.tanggal_visit).toLocaleDateString('id-ID')}</p>
                        <p className="mt-1 text-xs text-slate-500">{visit.assigned_to || 'Unassigned'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-sm text-slate-500">No visits planned yet</div>
                  )}
                </div>
              </section>
            </div>

            {uniquePendingUnplannedVisits.length > 0 && (
              <section className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                      <Clock className="text-amber-700" size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">Pending Unplanned Visits Approval</h2>
                      <p className="text-sm text-slate-500">Validasi kunjungan tidak terencana dari team sebelum masuk riwayat/report.</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {uniquePendingUnplannedVisits.length} pending
                  </span>
                </div>

                <div className="space-y-3">
                  {uniquePendingUnplannedVisits.map((visit) => (
                    <div key={visit.id} className="flex flex-col gap-4 rounded-lg border border-amber-100 bg-amber-50 p-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                          <MapPin className="text-amber-700" size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">{visit.customer_name}</p>
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Unplanned</span>
                          </div>
                          <p className="text-sm text-slate-700">{visit.customer_company || '-'}</p>
                          <p className="mt-1 text-sm text-slate-600">{visit.visit_purpose}</p>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                            <div><span className="font-semibold">Sales:</span> {visit.visitor?.name || '-'}</div>
                            <div><span className="font-semibold">Date:</span> {new Date(visit.visit_date).toLocaleDateString('id-ID')}</div>
                            <div><span className="font-semibold">Outcome:</span> {VISIT_OUTCOME_LABELS[visit.visit_outcome] || visit.visit_outcome || '-'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => handleApproveUnplanned(visit.id)}
                          disabled={processingVisitIds.has(visit.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          <CheckCircle size={16} />
                          {processingVisitIds.has(visit.id) ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectUnplanned(visit.id)}
                          disabled={processingVisitIds.has(visit.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          <XCircle size={16} />
                          {processingVisitIds.has(visit.id) ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Warning yang Perlu Dicek</h2>
                    <p className="text-sm text-slate-500">Klik lihat semua untuk cek detail dan tandai selesai dicek.</p>
                  </div>
                  <button onClick={() => window.location.href = '/warnings'} className="text-sm font-semibold text-red-700 hover:text-red-800">
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {uniqueWarnings.length > 0 ? uniqueWarnings.map((warning) => (
                    <div key={warning.id} className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                        <AlertTriangle className="text-red-700" size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-950">{warning.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{warning.message}</p>
                        <p className="mt-2 text-xs font-medium text-red-700">{warning.user?.name || 'System'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-sm text-slate-500">No warnings</div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Performa Sales</h2>
                    <p className="text-sm text-slate-500">Ringkasan performa sales bulan ini.</p>
                  </div>
                  <button onClick={() => window.location.href = '/visit-reports'} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    Lihat Detail
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                    <span className="text-sm text-slate-700">Total Sales Active</span>
                    <span className="font-semibold text-emerald-700">{stats.total_sales}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                    <span className="text-sm text-slate-700">Visits This Month</span>
                    <span className="font-semibold text-blue-700">{stats.visits_this_month || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
                    <span className="text-sm text-slate-700">Completion Rate</span>
                    <span className="font-semibold text-amber-700">{stats.completion_rate || 0}%</span>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">Quick Actions</h2>
                <p className="text-sm text-slate-500">Akses cepat untuk kerja harian sales manager.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {quickActions.map(({ label, icon: Icon, path }) => (
                  <button
                    key={label}
                    onClick={() => window.location.href = path}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Icon className="text-emerald-700" size={20} />
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
