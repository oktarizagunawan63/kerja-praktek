import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, CheckCircle, Clock, User, Trash2, Filter, ArrowRight } from '@icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import '../styles/responsive-global.css'

const PAGE_SIZE = 10

export default function WarningsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [warnings, setWarnings] = useState([])
  const [warningStats, setWarningStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all', // all, unread, read
    start_date: '',
    end_date: ''
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

  useEffect(() => {
    setPage(1)
  }, [filters, warnings.length])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch warnings
      const warningsResponse = await api.getWarnings(filters)
      const warningsData = warningsResponse.data?.data || warningsResponse.data || []
      setWarnings(Array.isArray(warningsData) ? warningsData : [])
      
      // Fetch warning stats
      const statsResponse = await api.getWarningStats()
      setWarningStats({
        ...(warningsResponse.summary || {}),
        ...(statsResponse.data || {})
      })
      
    } catch (error) {
      toast.error('Gagal memuat data warnings')
      console.error('Error fetching warnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (warning) => {
    try {
      await api.markWarningRead(warning.id)
      toast.success('Warning ditandai sebagai dibaca')
      fetchData()
    } catch (error) {
      toast.error('Gagal menandai warning sebagai dibaca')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllWarningsRead()
      toast.success('Semua warning ditandai sebagai dibaca')
      fetchData()
    } catch (error) {
      toast.error('Gagal menandai semua warning sebagai dibaca')
    }
  }

  const handleDeleteWarning = async (warning) => {
    if (!window.confirm('Hapus warning ini?')) return
    
    try {
      await api.deleteWarning(warning.id)
      toast.success('Warning berhasil dihapus')
      fetchData()
    } catch (error) {
      toast.error('Gagal menghapus warning')
    }
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700'
    }
    
    const labels = {
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[priority] || badges.medium}`}>
        {labels[priority] || priority}
      </span>
    )
  }

  const getReadBadge = (warning) => (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
      warning.is_read ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
    }`}>
      {warning.is_read ? <CheckCircle size={13} /> : <Clock size={13} />}
      {warning.is_read ? 'Sudah Dicek' : 'Perlu Dicek'}
    </span>
  )

  const formatWarningDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('id-ID')
  }

  const formatWarningTime = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getWarningActionLabel = (warning) => {
    const type = warning.type || ''
    if (type === 'missed_visit') return 'Cek riwayat visit'
    if (type === 'late_attendance' || type === 'no_attendance') return 'Cek attendance'
    return 'Lihat detail'
  }

  const handleOpenRelatedAction = (warning) => {
    const type = warning.type || ''
    if (type === 'late_attendance' || type === 'no_attendance') {
      navigate('/attendance')
      return
    }

    navigate('/realisasi-visits')
  }

  const totalPages = Math.max(1, Math.ceil(warnings.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedWarnings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return warnings.slice(start, start + PAGE_SIZE)
  }, [warnings, currentPage])

  // Only Sales Manager can access this page
  if (!can(user, 'view_all_warnings')) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki akses untuk melihat halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-responsive spacing-md">
      {/* Header */}
      <div className="header-responsive">
        <div>
          <h1 className="header-title">Pusat Warning</h1>
          <p className="header-subtitle">Daftar masalah operasional yang perlu dicek, seperti visit terlewat atau absensi bermasalah.</p>
        </div>
        
        <button 
          onClick={handleMarkAllAsRead}
          className="btn-responsive primary"
        >
          <CheckCircle size={16} />
          <span className="mobile-hidden">Tandai Semua Sudah Dicek</span>
          <span className="desktop-hidden tablet-hidden">Selesai</span>
        </button>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} />
          <div>
            <p className="text-sm font-semibold text-amber-900">Warning dipakai untuk hal yang perlu tindakan.</p>
            <p className="mt-1 text-sm text-amber-800">
              Buka aksi terkait dulu, lalu tandai warning sebagai sudah dicek supaya daftar tetap bersih.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive sm-2 md-4 spacing-md">
        <div className="stats-card" style={{ borderLeft: '4px solid #de168c' }}>
          <div className="stats-card-header">
            <div>
              <p className="stats-card-label">Total Warning</p>
              <p className="stats-card-value" style={{ color: '#de168c' }}>{warningStats.total || 0}</p>
            </div>
            <div className="stats-card-icon" style={{ background: '#de168c' }}>
              <AlertTriangle className="text-white" size={20} />
            </div>
          </div>
        </div>
        
        <div className="stats-card" style={{ borderLeft: '4px solid #8ac04a' }}>
          <div className="stats-card-header">
            <div>
              <p className="stats-card-label">Perlu Dicek</p>
              <p className="stats-card-value" style={{ color: '#8ac04a' }}>{warningStats.unread || 0}</p>
            </div>
            <div className="stats-card-icon" style={{ background: '#8ac04a' }}>
              <Clock className="text-white" size={20} />
            </div>
          </div>
        </div>
        
        <div className="stats-card" style={{ borderLeft: '4px solid #5a9844' }}>
          <div className="stats-card-header">
            <div>
              <p className="stats-card-label">Sudah Dicek</p>
              <p className="stats-card-value" style={{ color: '#5a9844' }}>{warningStats.read || 0}</p>
            </div>
            <div className="stats-card-icon" style={{ background: '#5a9844' }}>
              <CheckCircle className="text-white" size={20} />
            </div>
          </div>
        </div>
        
        <div className="stats-card" style={{ borderLeft: '4px solid #237043' }}>
          <div className="stats-card-header">
            <div>
              <p className="stats-card-label">Prioritas Tinggi</p>
              <p className="stats-card-value" style={{ color: '#237043' }}>{warningStats.high_priority || 0}</p>
            </div>
            <div className="stats-card-icon" style={{ background: '#237043' }}>
              <AlertTriangle className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-panel">
        <h2 className="filter-title">
          <Filter size={18} />
          Filter Warning
        </h2>
        
        <div className="form-row-responsive sm-2 md-3">
          <div className="form-group-responsive">
            <label className="text-responsive-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-responsive"
            >
              <option value="all">Semua</option>
              <option value="unread">Perlu Dicek</option>
              <option value="read">Sudah Dicek</option>
            </select>
          </div>
          
          <div className="form-group-responsive">
            <label className="text-responsive-sm font-medium text-gray-700">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="input-responsive"
            />
          </div>
          
          <div className="form-group-responsive">
            <label className="text-responsive-sm font-medium text-gray-700">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="input-responsive"
            />
          </div>
        </div>
      </div>

      {/* Warnings List */}
      <div className="card-compact overflow-hidden">
        <WarningsCardList
          warnings={paginatedWarnings}
          loading={loading}
          emptyMessage="Tidak ada warning"
          getReadBadge={getReadBadge}
          getPriorityBadge={getPriorityBadge}
          getWarningActionLabel={getWarningActionLabel}
          handleOpenRelatedAction={handleOpenRelatedAction}
          handleMarkAsRead={handleMarkAsRead}
          handleDeleteWarning={handleDeleteWarning}
          formatWarningDate={formatWarningDate}
          formatWarningTime={formatWarningTime}
          canDelete={user?.role === 'administrator'}
        />
        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={warnings.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}

function WarningsCardList({
  warnings,
  loading,
  emptyMessage,
  getReadBadge,
  getPriorityBadge,
  getWarningActionLabel,
  handleOpenRelatedAction,
  handleMarkAsRead,
  handleDeleteWarning,
  formatWarningDate,
  formatWarningTime,
  canDelete,
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (warnings.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">{emptyMessage}</div>
  }

  return (
    <div className="divide-y divide-gray-100">
      {warnings.map((warning) => (
        <article key={warning.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {getReadBadge(warning)}
                {warning.priority && getPriorityBadge(warning.priority)}
              </div>
              <h3 className={`text-sm font-semibold ${warning.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                {warning.title}
              </h3>
              <p className={`mt-1 break-words text-sm leading-6 ${warning.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                {warning.message}
              </p>
              {warning.plan_visit?.customer?.name && (
                <p className="mt-2 break-words text-xs font-medium text-amber-700">
                  Customer: {warning.plan_visit.customer.name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 sm:w-56 sm:grid-cols-1 sm:text-right">
              <div>
                <p className="font-medium text-gray-900">{warning.user?.name || '-'}</p>
                <p>{warning.user?.role || '-'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">{formatWarningDate(warning.created_at)}</p>
                <p>{formatWarningTime(warning.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={() => handleOpenRelatedAction(warning)}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
              title={getWarningActionLabel(warning)}
            >
              <ArrowRight size={13} />
              {getWarningActionLabel(warning)}
            </button>
            {!warning.is_read && (
              <button
                onClick={() => handleMarkAsRead(warning)}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-green-100 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50"
                title="Tandai sebagai dibaca"
              >
                <CheckCircle size={14} />
                Selesai dicek
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteWarning(warning)}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                title="Hapus"
              >
                <Trash2 size={14} />
                Hapus
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  if (total <= pageSize) return null

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Menampilkan {start}-{end} dari {total} warning
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <span className="min-w-20 text-center text-xs font-semibold text-gray-700">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}
