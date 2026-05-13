import { useState, useEffect } from 'react'
import { Filter, Search, Trash2, Edit2, X, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
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

  // Listen for navigation state to force refresh
  useEffect(() => {
    const handleLocationChange = () => {
      const state = window.history.state?.usr
      if (state?.refreshStats) {
        fetchData()
      }
    }
    
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

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
      prospek: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
      qualified: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      proposal: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      negosiasi: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
      closing: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    }
    
    const labels = {
      prospek: 'Prospect',
      qualified: 'Qualified',
      proposal: 'Proposal',
      negosiasi: 'Negotiation',
      closing: 'Closing'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badges[stage]}`}>
        {labels[stage]}
      </span>
    )
  }

  const getWinProbabilityBadge = (probability) => {
    const badges = {
      low: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      middle: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
      high: 'bg-green-50 text-green-700 ring-1 ring-green-200',
      very_high: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
    }
    
    const labels = {
      low: 'Low',
      middle: 'Medium',
      high: 'High',
      very_high: 'Very High'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badges[probability]}`}>
        {labels[probability]}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      won: 'bg-green-50 text-green-700 ring-1 ring-green-200',
      lost: 'bg-red-50 text-red-700 ring-1 ring-red-200'
    }
    
    const labels = {
      open: 'Open',
      won: 'Won',
      lost: 'Lost'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 border-b border-blue-500">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Sales Funnel</h1>
              <p className="text-blue-100">Kelola pipeline penjualan Anda</p>
            </div>
            <button
              onClick={() => navigate('/funnels/create')}
              className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-md shadow-lg transition-colors"
            >
              + Tambah Deal
            </button>
          </div>

          {/* Stats Cards - Integrated in Header */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-5 border border-white/20">
                <p className="text-blue-100 text-sm font-medium mb-1">Active Deals</p>
                <p className="text-3xl font-bold text-white">{stats.total_deal_open || 0}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-md p-5 border border-white/20">
                <p className="text-blue-100 text-sm font-medium mb-1">Won This Month</p>
                <p className="text-3xl font-bold text-white">
                  {(Number(stats.total_menang_bulan_ini || 0) / 1000000).toFixed(1)}M
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-md p-5 border border-white/20">
                <p className="text-blue-100 text-sm font-medium mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-white">{stats.win_rate_bulan_ini || 0}%</p>
                <p className="text-xs text-blue-200 mt-1">Bulan ini</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">

      {/* Filters & Search */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customer, company, or location..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition-colors font-medium ${
                showFilters 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showFilters ? '✕ Tutup Filter' : '⚙ Filter'}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium"
            >
              <option value="created_at">Terbaru</option>
              <option value="deadline_terdekat">Deadline</option>
              <option value="last_update">Update Terakhir</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>

                <select
                  value={filters.segment}
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Segments</option>
                  <option value="sot">SOT</option>
                  <option value="igvm">IGVM</option>
                  <option value="nursecall">NurseCall</option>
                  <option value="umum">General</option>
                </select>

                <select
                  value={filters.channel}
                  onChange={(e) => handleFilterChange('channel', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Channels</option>
                  <option value="kontraktor">Contractor</option>
                  <option value="subdist">Subdist</option>
                  <option value="rsud">RSUD</option>
                  <option value="rs_swasta">Private Hospital</option>
                  <option value="klinik">Clinic</option>
                  <option value="puskesmas">Puskesmas</option>
                  <option value="lainnya">Other</option>
                </select>

                <select
                  value={filters.deal_stage}
                  onChange={(e) => handleFilterChange('deal_stage', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Stages</option>
                  <option value="prospek">Prospect</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negosiasi">Negotiation</option>
                  <option value="closing">Closing</option>
                </select>

                <select
                  value={filters.win_probability}
                  onChange={(e) => handleFilterChange('win_probability', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Probability</option>
                  <option value="low">Low</option>
                  <option value="middle">Middle</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>
              
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Hapus semua filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Funnels Table/Cards */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading deals...</p>
          </div>
        ) : funnels.length === 0 ? (
          <div className="p-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada deal</h3>
            <p className="text-gray-600 mb-6">Mulai tracking peluang penjualan Anda</p>
            <button
              onClick={() => navigate('/funnels/create')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Tambah Deal Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Channel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Segment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Probability</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funnels.map((funnel) => (
                  <tr key={funnel.id} className="hover:bg-blue-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{funnel.customer_name}</p>
                        <p className="text-sm text-gray-500">{funnel.customer_company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 capitalize">
                        {funnel.channel === 'lainnya' ? funnel.channel_other : funnel.channel.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{funnel.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 uppercase">
                        {funnel.segment === 'umum' ? funnel.segment_custom : funnel.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{funnel.qty} {funnel.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getDealStageBadge(funnel.deal_stage)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {new Date(funnel.target_close_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getWinProbabilityBadge(funnel.win_probability)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{funnel.assigned_user?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(funnel.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/funnels/${funnel.id}`)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Lihat
                        </button>
                        {(funnel.status === 'open' || isAdmin) && (
                          <button
                            onClick={() => navigate(`/funnels/${funnel.id}/edit`)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(funnel)}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Hapus
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
  </div>
  )
}
