import { useState, useEffect } from 'react'
import { Search } from '@icons'
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
    <div className="min-h-screen bg-slate-50 p-6 overflow-x-hidden">
      <div className="mx-auto max-w-full space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Sales Funnel</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola pipeline penjualan Anda</p>
          </div>
          <button
            onClick={() => navigate('/funnels/create')}
            className="inline-flex items-center justify-center rounded-lg bg-[#237043] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a9844]"
          >
            + Tambah Deal
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Active Deals</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.total_deal_open || 0}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Won This Month</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">
                {(Number(stats.total_menang_bulan_ini || 0) / 1000000).toFixed(1)}M
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Win Rate</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.win_rate_bulan_ini || 0}%</p>
              <p className="mt-1 text-xs text-slate-400">Bulan ini</p>
            </div>
          </div>
        )}

      {/* Filters & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customer, company, or location..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-11 pr-4 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl border transition-colors font-medium whitespace-nowrap ${
                showFilters 
                  ? 'bg-[#237043] text-white border-[#237043]' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showFilters ? 'Tutup Filter' : 'Filter'}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
            >
              <option value="created_at">Terbaru</option>
              <option value="deadline_terdekat">Close Date</option>
              <option value="last_update">Update Terakhir</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>

                <select
                  value={filters.segment}
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
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
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
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
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
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
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-2 focus:ring-[#237043]/15"
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
                  className="text-sm font-medium text-[#237043] hover:text-[#5a9844]"
                >
                  Hapus semua filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Funnels Table/Cards */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#237043]"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading deals...</p>
          </div>
        ) : funnels.length === 0 ? (
          <div className="p-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada deal</h3>
            <p className="text-gray-600 mb-6">Mulai tracking peluang penjualan Anda</p>
            <button
              onClick={() => navigate('/funnels/create')}
              className="rounded-xl bg-[#237043] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a9844]"
            >
              + Tambah Deal Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Channel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Segment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Close Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Probability</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funnels.map((funnel) => (
                  <tr key={funnel.id} className="group transition-colors hover:bg-slate-50">
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
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/funnels/${funnel.id}`)}
                          className="rounded-xl px-3 py-1.5 text-sm font-medium text-[#237043] transition-colors hover:bg-slate-100"
                        >
                          Lihat
                        </button>
                        {(funnel.status === 'open' || isAdmin) && (
                          <button
                            onClick={() => navigate(`/funnels/${funnel.id}/edit`)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(funnel)}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-xl transition-colors"
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

