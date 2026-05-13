import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Users, MapPin, Package, Award, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function FunnelDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState(null)
  const [showWonModal, setShowWonModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [wonForm, setWonForm] = useState({
    won_reason_category: '',
    won_notes: '',
    won_date: new Date().toISOString().split('T')[0]
  })
  const [lostForm, setLostForm] = useState({
    lost_reason_category: '',
    lost_competitor: '',
    lost_notes: '',
    lost_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const funnelResponse = await api.getFunnel(id)
      setFunnel(funnelResponse.data)
    } catch (error) {
      console.error('Error fetching funnel:', error)
      toast.error('Gagal memuat data funnel')
      navigate('/funnels')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsWon = async (e) => {
    e.preventDefault()
    
    if (!wonForm.won_reason_category) {
      toast.error('Pilih kategori alasan menang')
      return
    }
    
    try {
      await api.markFunnelAsWon(id, wonForm)
      toast.success('Funnel berhasil ditandai sebagai menang!')
      setShowWonModal(false)
      navigate('/funnels')
    } catch (error) {
      console.error('Error marking as won:', error)
      toast.error('Gagal menandai sebagai menang')
    }
  }

  const handleMarkAsLost = async (e) => {
    e.preventDefault()
    
    if (!lostForm.lost_reason_category) {
      toast.error('Pilih kategori alasan kalah')
      return
    }
    
    if (lostForm.lost_reason_category === 'kalah_kompetitor' && !lostForm.lost_competitor) {
      toast.error('Nama kompetitor wajib diisi')
      return
    }
    
    try {
      await api.markFunnelAsLost(id, lostForm)
      toast.success('Funnel berhasil ditandai sebagai kalah')
      setShowLostModal(false)
      navigate('/funnels')
    } catch (error) {
      console.error('Error marking as lost:', error)
      toast.error('Gagal menandai sebagai kalah')
    }
  }

  const getDealStageBadge = (stage) => {
    const badges = {
      prospek: { color: 'bg-gray-100 text-gray-700', label: 'Prospek' },
      qualified: { color: 'bg-blue-100 text-blue-700', label: 'Qualified' },
      proposal: { color: 'bg-yellow-100 text-yellow-700', label: 'Proposal' },
      negosiasi: { color: 'bg-orange-100 text-orange-700', label: 'Negosiasi' },
      closing: { color: 'bg-green-100 text-green-700', label: 'Closing' }
    }
    const badge = badges[stage] || badges.prospek
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
  }

  const getWinProbabilityBadge = (probability) => {
    const badges = {
      low: { color: 'bg-red-100 text-red-700', label: 'Low' },
      middle: { color: 'bg-yellow-100 text-yellow-700', label: 'Middle' },
      high: { color: 'bg-green-100 text-green-700', label: 'High' },
      very_high: { color: 'bg-blue-100 text-blue-700', label: 'Very High' }
    }
    const badge = badges[probability] || badges.middle
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: { color: 'bg-blue-100 text-blue-700', label: 'Open' },
      won: { color: 'bg-green-100 text-green-700', label: 'Menang' },
      lost: { color: 'bg-red-100 text-red-700', label: 'Kalah' }
    }
    const badge = badges[status] || badges.open
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading funnel...</p>
        </div>
      </div>
    )
  }

  if (!funnel) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Funnel Not Found</h2>
          <p className="text-red-600 mb-4">Funnel yang Anda cari tidak ditemukan</p>
          <Button onClick={() => navigate('/funnels')} className="bg-red-600 hover:bg-red-700">
            Kembali ke List
          </Button>
        </div>
      </div>
    )
  }


  return (
    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => navigate('/funnels')} className="mb-4">
            <ArrowLeft size={16} />
            Kembali
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{funnel.customer_name}</h1>
            {getStatusBadge(funnel.status)}
          </div>
          <p className="text-gray-600">{funnel.customer_company}</p>
        </div>
        <div className="flex gap-2">
          {funnel.status === 'open' && (
            <>
              <Button variant="outline" onClick={() => navigate(`/funnels/${id}/edit`)}>
                <Edit size={16} />
                Edit
              </Button>
              <Button onClick={() => setShowWonModal(true)} className="bg-green-600 hover:bg-green-700">
                <TrendingUp size={16} />
                Menang
              </Button>
              <Button onClick={() => setShowLostModal(true)} className="bg-red-600 hover:bg-red-700">
                <TrendingDown size={16} />
                Kalah
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Deal Stage</p>
                {getDealStageBadge(funnel.deal_stage)}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Win Probability</p>
                {getWinProbabilityBadge(funnel.win_probability)}
                <span className="ml-2 text-sm text-gray-700">({funnel.win_percentage}%)</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">QTY</p>
                <p className="text-lg font-semibold text-gray-900">{funnel.qty} {funnel.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Target Close Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(funnel.target_close_date).toLocaleDateString('id-ID', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Deadline Customer</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(funnel.deadline_date).toLocaleDateString('id-ID', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Location */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer & Location</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{funnel.customer_phone || '-'}</p>
                  <p className="text-sm text-gray-700">{funnel.customer_email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-sm font-medium text-gray-900">{funnel.city}</p>
                  {funnel.province && <p className="text-sm text-gray-700">{funnel.province}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-sm text-gray-600">Channel & Segment</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {funnel.channel === 'lainnya' ? funnel.channel_other : funnel.channel.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-700 uppercase">
                    {funnel.segment === 'umum' ? funnel.segment_custom : funnel.segment}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned To */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assigned To</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Users className="text-red-600" size={18} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{funnel.assigned_user?.name}</p>
                <p className="text-xs text-gray-500">Sales</p>
              </div>
            </div>
          </div>

          {/* Created By */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Created By</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={18} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{funnel.creator?.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(funnel.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Won/Lost Info */}
          {funnel.status === 'won' && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Award size={16} />
                Deal Won!
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-green-700">Estimated Value</p>
                  <p className="text-lg font-bold text-green-900">
                    Rp {Number(funnel.estimated_value).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Reason</p>
                  <p className="text-sm text-green-900 capitalize">{funnel.won_reason_category?.replace('_', ' ')}</p>
                </div>
                {funnel.won_notes && (
                  <div>
                    <p className="text-xs text-green-700">Notes</p>
                    <p className="text-sm text-green-900">{funnel.won_notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-green-700">Won Date</p>
                  <p className="text-sm text-green-900">
                    {new Date(funnel.won_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {funnel.status === 'lost' && (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle size={16} />
                Deal Lost
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-red-700">Reason</p>
                  <p className="text-sm text-red-900 capitalize">{funnel.lost_reason_category?.replace('_', ' ')}</p>
                </div>
                {funnel.lost_competitor && (
                  <div>
                    <p className="text-xs text-red-700">Lost to Competitor</p>
                    <p className="text-sm text-red-900">{funnel.lost_competitor}</p>
                  </div>
                )}
                {funnel.lost_notes && (
                  <div>
                    <p className="text-xs text-red-700">Notes</p>
                    <p className="text-sm text-red-900">{funnel.lost_notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-red-700">Lost Date</p>
                  <p className="text-sm text-red-900">
                    {new Date(funnel.lost_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Won Modal */}
      {showWonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mark as Won</h2>
            <form onSubmit={handleMarkAsWon}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Alasan Menang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={wonForm.won_reason_category}
                    onChange={(e) => setWonForm(prev => ({ ...prev, won_reason_category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Pilih Alasan</option>
                    <option value="harga_kompetitif">Harga Kompetitif</option>
                    <option value="relasi">Relasi / Kedekatan dengan Customer</option>
                    <option value="spesifikasi">Spesifikasi Produk Sesuai</option>
                    <option value="after_sales">Pelayanan After Sales Baik</option>
                    <option value="pengiriman">Pengiriman Cepat</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={wonForm.won_notes}
                    onChange={(e) => setWonForm(prev => ({ ...prev, won_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Jelaskan kenapa menang..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Closing <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={wonForm.won_date}
                    onChange={(e) => setWonForm(prev => ({ ...prev, won_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  Konfirmasi Menang
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowWonModal(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mark as Lost</h2>
            <form onSubmit={handleMarkAsLost}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Alasan Kalah <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={lostForm.lost_reason_category}
                    onChange={(e) => setLostForm(prev => ({ ...prev, lost_reason_category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">Pilih Alasan</option>
                    <option value="kalah_harga">Kalah Harga</option>
                    <option value="kalah_spesifikasi">Kalah Spesifikasi Produk</option>
                    <option value="kalah_kompetitor">Kalah dari Kompetitor</option>
                    <option value="budget_dipotong">Budget Customer Dipotong</option>
                    <option value="proyek_ditunda">Proyek Ditunda</option>
                    <option value="customer_batal">Customer Tidak Jadi Beli</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                {lostForm.lost_reason_category === 'kalah_kompetitor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Kompetitor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lostForm.lost_competitor}
                      onChange={(e) => setLostForm(prev => ({ ...prev, lost_competitor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="PT Competitor ABC"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={lostForm.lost_notes}
                    onChange={(e) => setLostForm(prev => ({ ...prev, lost_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Jelaskan kenapa kalah..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Dipastikan Kalah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={lostForm.lost_date}
                    onChange={(e) => setLostForm(prev => ({ ...prev, lost_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                  Konfirmasi Kalah
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowLostModal(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
