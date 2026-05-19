import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, User, Trash2, Filter, ArrowRight } from '@icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'
import '../styles/responsive-global.css'

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

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

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

  const getStatusIcon = (warning) => {
    if (warning.is_read) {
      return <CheckCircle className="text-green-500" size={16} />
    }
    return <Clock className="text-yellow-500" size={16} />
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

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (warning) => getStatusIcon(warning)
    },
    {
      key: 'priority',
      label: 'Prioritas',
      render: (warning) => getPriorityBadge(warning.priority)
    },
    {
      key: 'title',
      label: 'Warning',
      render: (warning) => (
        <div className="min-w-[260px] max-w-xl">
          <p className={`font-medium ${warning.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
            {warning.title}
          </p>
          <p className={`text-sm ${warning.is_read ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {warning.message}
          </p>
          {warning.plan_visit?.customer?.name && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Customer: {warning.plan_visit.customer.name}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (warning) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{warning.user?.name}</p>
            <p className="text-xs text-gray-500">{warning.user?.role}</p>
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Waktu',
      render: (warning) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(warning.created_at).toLocaleDateString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(warning.created_at).toLocaleTimeString('id-ID')}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (warning) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenRelatedAction(warning)}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
            title={getWarningActionLabel(warning)}
          >
            <ArrowRight size={13} />
            {getWarningActionLabel(warning)}
          </button>
          {!warning.is_read && (
            <button
              onClick={() => handleMarkAsRead(warning)}
              className="inline-flex items-center gap-1 rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
              title="Tandai sebagai dibaca"
            >
              <CheckCircle size={14} />
              Selesai dicek
            </button>
          )}
          {user?.role === 'administrator' && (
            <button
              onClick={() => handleDeleteWarning(warning)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    }
  ]

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

      {/* Warnings Table */}
      <div className="card-compact">
        <div className="table-responsive">
          <DataTable
            columns={columns}
            data={warnings}
            loading={loading}
            emptyMessage="Tidak ada warning"
          />
        </div>
      </div>
    </div>
  )
}
