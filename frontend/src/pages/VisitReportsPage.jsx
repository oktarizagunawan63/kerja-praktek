import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function VisitReportsPage() {
  const { user } = useAuthStore()
  const [reportData, setReportData] = useState(null)
  const [salesPerformance, setSalesPerformance] = useState([])
  const [detailedVisits, setDetailedVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    period: 'monthly',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    sales_id: ''
  })
  const [salesUsers, setSalesUsers] = useState([])

  useEffect(() => {
    if (can(user, 'view_sales_performance')) fetchSalesUsers()
  }, [user])

  useEffect(() => { fetchData() }, [filters])

  const fetchSalesUsers = async () => {
    try {
      const response = await api.getSalesUsers()
      setSalesUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      setSalesUsers([])
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const reportResponse = await api.getVisitReport(filters)
      setReportData(reportResponse.data)

      // Fetch detailed visits for table + PDF
      const visitsResponse = await api.getRealisasiVisits()
      const allVisits = Array.isArray(visitsResponse.data) ? visitsResponse.data : []

      const filteredVisits = allVisits.filter(visit => {
        const hasLinkedCustomer = Boolean(visit.plan_visit?.customer?.id || visit.direct_customer?.id)
        const visitDate = visit.visit_date || visit.visit_time?.split('T')[0] || visit.created_at?.split('T')[0]
        return hasLinkedCustomer && visitDate >= filters.start_date && visitDate <= filters.end_date
      })
      const finalVisits = filters.sales_id
        ? filteredVisits.filter(v => String(v.visited_by) === String(filters.sales_id))
        : filteredVisits
      setDetailedVisits(finalVisits)

      if (can(user, 'view_sales_performance')) {
        const perf = await api.getSalesPerformance({ start_date: filters.start_date, end_date: filters.end_date })
        setSalesPerformance(Array.isArray(perf.data) ? perf.data : [])
      }
    } catch (error) {
      toast.error('Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const handleExportPDF = async () => {
    if (!detailedVisits || detailedVisits.length === 0) {
      toast.error('Tidak ada data untuk di-export')
      return
    }
    try {
      const { exportVisitReportsPDF } = await import('../lib/exportPdf')
      const statistics = {
        totalVisits: reportData?.summary?.total_visits || detailedVisits.length,
        completed: reportData?.summary?.completed_visits || 0,
        missed: reportData?.summary?.missed_visits || 0,
        performanceRate: reportData?.summary?.performance_rate || 0
      }
      const exportFilters = { ...filters }
      if (filters.sales_id && salesUsers.length > 0) {
        const sel = salesUsers.find(s => String(s.id) === String(filters.sales_id))
        if (sel) exportFilters.sales_name = sel.name
      }
      exportVisitReportsPDF(detailedVisits, exportFilters, statistics)
      toast.success('PDF berhasil di-export')
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Gagal export PDF')
    }
  }

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' }
    if (rate >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' }
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' }
  }

  const getOutcomeLabel = (outcome) => {
    const map = { closed: 'Closed', follow_up: 'Follow-up', not_interested: 'Tdk Tertarik', rescheduled: 'Dijadwal Ulang' }
    return map[outcome] || '-'
  }

  const getOutcomeBadge = (outcome) => {
    if (outcome === 'closed') return 'bg-emerald-100 text-emerald-700'
    if (outcome === 'follow_up') return 'bg-blue-100 text-blue-700'
    if (outcome === 'not_interested') return 'bg-gray-100 text-gray-600'
    if (outcome === 'rescheduled') return 'bg-amber-100 text-amber-700'
    return 'bg-gray-100 text-gray-500'
  }

  const isSalesManager = can(user, 'view_sales_performance')
  const summary = reportData?.summary
  const periodData = reportData?.period_data || []

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-950">Laporan Kunjungan</h1>
          <p className="text-sm text-slate-500">Laporan dan analisis kunjungan sales</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={detailedVisits.length === 0}
          className="rounded-lg bg-[#237043] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a9844] disabled:bg-slate-300"
        >
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">⚙ Filter Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Periode</label>
            <select
              value={filters.period}
              onChange={e => handleFilterChange('period', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Mulai</label>
            <input type="date" value={filters.start_date}
              onChange={e => handleFilterChange('start_date', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Akhir</label>
            <input type="date" value={filters.end_date}
              onChange={e => handleFilterChange('end_date', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15" />
          </div>
          {isSalesManager && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Sales</label>
              <select value={filters.sales_id}
                onChange={e => handleFilterChange('sales_id', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15">
                <option value="">Semua Sales</option>
                {salesUsers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5">
              <div className="h-4 bg-gray-100 rounded mb-3 w-3/4"></div>
              <div className="h-8 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Kunjungan', value: summary.total_visits, sub: 'dalam periode ini' },
            { label: 'Selesai', value: summary.completed_visits, sub: 'kunjungan berhasil' },
            { label: 'Terlewat', value: summary.missed_visits, sub: 'tidak dilakukan' },
            { label: 'Performance', value: `${summary.performance_rate}%`, sub: 'tingkat keberhasilan' },
          ].map((card, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-3">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Period Data Table — FIX: pakai item.date bukan item.period */}
      {periodData.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-800">Data Per Periode</h2>
            <span className="text-xs text-gray-400">{periodData.length} periode</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Tanggal', 'Total Visit', 'Selesai', 'Completion Rate'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {periodData.map((item, i) => {
                  const rate = item.planned > 0 ? Math.round((item.completed / item.planned) * 100) : 0
                  const clr = getPerformanceColor(rate)
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                        {item.date ? new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-700">{item.planned || 0}</td>
                      <td className="px-6 py-3.5 text-sm font-medium text-emerald-600">{item.completed || 0}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                            <div className={`h-1.5 rounded-full ${clr.bar}`} style={{ width: `${Math.min(rate, 100)}%` }}></div>
                          </div>
                          <span className={`text-xs font-semibold ${clr.text}`}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Kunjungan Table */}
      <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-800">Riwayat Kunjungan Detail</h2>
          <span className="text-xs text-gray-400">{detailedVisits.length} kunjungan</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm">Memuat data...</p>
          </div>
        ) : detailedVisits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Tidak ada data kunjungan</p>
            <p className="text-xs text-gray-400">Coba ubah filter tanggal atau pilih periode lain</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Customer', 'Perusahaan', 'Sales', 'Tanggal', 'Tipe', 'Status', 'Hasil'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {detailedVisits.map((visit, i) => {
                  const customer = visit.plan_visit?.customer || visit.direct_customer || {}
                  const customerName = customer.name || visit.customer_name || '-'
                  const customerCompany = customer.company || visit.customer_company || '-'
                  const salesName = visit.visitor?.name || '-'
                  const visitDate = visit.visit_date
                    ? new Date(visit.visit_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    : visit.visit_time ? new Date(visit.visit_time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
                  return (
                    <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{customerName}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{customerCompany}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{salesName}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{visitDate}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${visit.type === 'unplanned' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'}`}>
                          {visit.type === 'unplanned' ? 'Unplanned' : 'Planned'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${visit.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {visit.status === 'done' ? 'Selesai' : 'Terlewat'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOutcomeBadge(visit.visit_outcome)}`}>
                          {getOutcomeLabel(visit.visit_outcome)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Performance (Sales Manager Only) */}
      {isSalesManager && salesPerformance.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-800">Performance Per Sales</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Sales', 'Total Visit', 'Selesai', 'Terlewat', 'Performance'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salesPerformance.map((item, i) => {
                  const clr = getPerformanceColor(item.performance_rate)
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#237043]">
                            <span className="text-white text-xs font-bold">{item.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.total_visits}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{item.completed_visits}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-500">{item.missed_visits}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${clr.bar} transition-all`} style={{ width: `${Math.min(item.performance_rate, 100)}%` }}></div>
                          </div>
                          <span className={`text-sm font-bold ${clr.text}`}>{item.performance_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

