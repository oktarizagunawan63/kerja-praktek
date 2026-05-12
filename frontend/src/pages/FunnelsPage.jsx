import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Filter, Search, Target, TrendingDown, Award, Trash2, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function FunnelsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'administrator'
  const [loading, setLoading] = useState(true)
  const [funnels, setFunnels] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    segment: '',
    channel: '',
    deal_stage: '',
    win_probability: '',
    assigned_to: '',
    month: '',
    search: ''
  })
  const [sortBy, setSortBy] = useState('created_at')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [filters, sortBy])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = {
        ...filters,
        sort_by: sortBy
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })
      
      const [funnelsResponse, statsResponse] = await Promise.all([
        api.getFunnels(params),
        api.getFunnelStats()
      ])
      
      setFunnels(funnelsResponse.data?.data || [])
      setStats(statsResponse.data)
      
    } catch (error) {
      console.error('Error fetching funnels:', error)
      toast.error('Gagal memuat data funnel')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (funnel) => {
    if (!confirm(`Hapus funnel "${funnel.customer_name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await api.deleteFunnel(funnel.id)
      toast.success('Funnel berhasil dihapus')
      fetchData()
    } catch (error) {
      toast.error(error?.message || 'Gagal menghapus funnel')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      segment: '',
      channel: '',
      deal_stage: '',
      win_probability: '',
      assigned_to: '',
      month: '',
      search: ''
    })
  }

  const getDealStageBadge = (stage) => {
    const badges = {
      prospek: 'bg-gray-100 text-gray-700',
      qualified: 'bg-blue-100 text-blue-700',
      proposal: 'bg-yellow-100 text-yellow-700',
      negosiasi: 'bg-orange-100 text-orange-700',
      closing: 'bg-green-100 text-green-700'
    }
    
    const labels = {
      prospek: 'Prospek',
      qualified: 'Qualified',
      proposal: 'Proposal',
      negosiasi: 'Negosiasi',
      closing: 'Closing'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badges[stage]}`}>
        {labels[stage]}
      </span>
    )
  }

  const getWinProbabilityBadge = (probability) => {
    const badges = {
      low: 'bg-red-100 text-red-700',
      middle: 'bg-yellow-100 text-yellow-700',
      high: 'bg-green-100 text-green-700',
      very_high: 'bg-blue-100 text-blue-700'
    }
    
    const labels = {
      low: 'Low',
      middle: 'Middle',
      high: 'High',
      very_high: 'Very High'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badges[probability]}`}>
        {labels[probability]}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-100 text-blue-700',
      won: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700'
    }
    
    const labels = {
      open: 'Open',
      won: 'Menang',
      lost: 'Kalah'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Funnel</h1>
              <p className="text-red-700">Manage your sales pipeline</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => navigate('/funnels/create')}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus size={16} />
          Tambah Funnel
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Deal Open</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total_deal_open || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Menang Bulan Ini</p>
                <p className="text-2xl font-bold text-green-700">
                  Rp {Number(stats.total_menang_bulan_ini || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Win Rate Bulan Ini</p>
                <p className="text-2xl font-bold text-purple-700">{stats.win_rate_bulan_ini || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Award className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari customer atau daerah..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-300"
          >
            <Filter size={16} />
            Filter
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="created_at">Terbaru</option>
            <option value="deadline_terdekat">Deadline Terdekat</option>
            <option value="last_update">Last Update</option>
          </select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Semua Status</option>
              <option value="open">Open</option>
              <option value="won">Menang</option>
              <option value="lost">Kalah</option>
            </select>

            <select
              value={filters.segment}
              onChange={(e) => handleFilterChange('segment', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Semua Segment</option>
              <option value="sot">SOT</option>
              <option value="igvm">IGVM</option>
              <option value="nursecall">NurseCall</option>
              <option value="umum">Umum</option>
            </select>

            <select
              value={filters.channel}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Semua Channel</option>
              <option value="kontraktor">Kontraktor</option>
              <option value="subdist">Subdist</option>
              <option value="rsud">RSUD</option>
              <option value="rs_swasta">RS Swasta</option>
              <option value="klinik">Klinik</option>
              <option value="puskesmas">Puskesmas</option>
              <option value="lainnya">Lainnya</option>
            </select>

            <select
              value={filters.deal_stage}
              onChange={(e) => handleFilterChange('deal_stage', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Semua Deal Stage</option>
              <option value="prospek">Prospek</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negosiasi">Negosiasi</option>
              <option value="closing">Closing</option>
            </select>

            <select
              value={filters.win_probability}
              onChange={(e) => handleFilterChange('win_probability', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Semua Peluang</option>
              <option value="low">Low</option>
              <option value="middle">Middle</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Funnels Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading funnels...</p>
          </div>
        ) : funnels.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-600 mb-4">Belum ada funnel</p>
            <Button
              onClick={() => navigate('/funnels/create')}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} />
              Tambah Funnel Pertama
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daerah</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QTY</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peluang</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {funnels.map((funnel) => (
                  <tr key={funnel.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{funnel.customer_name}</p>
                        <p className="text-sm text-gray-500">{funnel.customer_company}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 capitalize">
                        {funnel.channel === 'lainnya' ? funnel.channel_other : funnel.channel.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{funnel.city}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 uppercase">
                        {funnel.segment === 'umum' ? funnel.segment_custom : funnel.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{funnel.qty} {funnel.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getDealStageBadge(funnel.deal_stage)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {new Date(funnel.target_close_date).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getWinProbabilityBadge(funnel.win_probability)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{funnel.assigned_user?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(funnel.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/funnels/${funnel.id}`)}
                        >
                          Detail
                        </Button>
                        {/* Edit: open funnels OR admin can edit any */}
                        {(funnel.status === 'open' || isAdmin) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/funnels/${funnel.id}/edit`)}
                          >
                            <Edit2 size={13} />
                            Edit
                          </Button>
                        )}
                        {/* Delete: only admin */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(funnel)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus funnel"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
