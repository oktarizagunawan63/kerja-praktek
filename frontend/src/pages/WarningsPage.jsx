import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, User, Trash2, Filter } from 'lucide-react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

export default function WarningsPage() {
  const { user } = useAuthStore()
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
      setWarnings(warningsResponse.data.data || [])
      
      // Fetch warning stats
      const statsResponse = await api.getWarningStats()
      setWarningStats(statsResponse.data || {})
      
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
        <div>
          <p className={`font-medium ${warning.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
            {warning.title}
          </p>
          <p className={`text-sm ${warning.is_read ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {warning.message}
          </p>
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
          {!warning.is_read && (
            <button
              onClick={() => handleMarkAsRead(warning)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Tandai sebagai dibaca"
            >
              <CheckCircle size={14} />
            </button>
          )}
          <button
            onClick={() => handleDeleteWarning(warning)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  // Only Site Manager can access this page
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warning Management</h1>
          <p className="text-gray-600">Kelola warning dan notifikasi sistem</p>
        </div>
        
        <Button 
          onClick={handleMarkAllAsRead}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle size={16} />
          Mark All as Read
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-red-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Warnings</p>
              <p className="text-2xl font-bold text-red-700">{warningStats.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Unread</p>
              <p className="text-2xl font-bold text-yellow-700">{warningStats.unread || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Read</p>
              <p className="text-2xl font-bold text-green-700">{warningStats.read || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">High Priority</p>
              <p className="text-2xl font-bold text-blue-700">{warningStats.high_priority || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-green-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Filter Warnings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Semua</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>
          
          <Input
            label="Tanggal Mulai"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
          />
          
          <Input
            label="Tanggal Akhir"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>

      {/* Warnings Table */}
      <DataTable
        columns={columns}
        data={warnings}
        loading={loading}
        emptyMessage="Tidak ada warning"
      />
    </div>
  )
}