import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Users, MapPin, Package, Award, AlertCircle, Plus } from 'lucide-react'
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
  const [activities, setActivities] = useState([])
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showWonModal, setShowWonModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [activityForm, setActivityForm] = useState({
    activity_type: 'telepon',
    activity_date: new Date().toISOString().split('T')[0],
    notes: '',
    new_stage: '',
    new_probability: ''
  })
  const [wonForm, setWonForm] = useState({
    won_value: '',
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
      const [funnelResponse, activitiesResponse] = await Promise.all([
        api.getFunnel(id),
        api.getFunnelActivities(id)
      ])
      
      setFunnel(funnelResponse.data)
      setActivities(activitiesResponse.data || [])
    } catch (error) {
      console.error('Error fetching funnel:', error)
      toast.error('Gagal memuat data funnel')
      navigate('/funnels')
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async (e) => {
    e.preventDefault()
    
    if (!activityForm.notes || activityForm.notes.length < 10) {
      toast.error('Notes minimal 10 karakter')
      return
    }
    
    try {
      await api.createFunnelActivity(id, activityForm)
      toast.success('Activity berhasil ditambahkan')
      setShowActivityForm(false)
      setActivityForm({
        activity_type: 'telepon',
        activity_date: new Date().toISOString().split('T')[0],
        notes: '',
        new_stage: '',
        new_probability: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error adding activity:', error)
      toast.error('Gagal menambahkan activity')
    }
  }

  const handleMarkAsWon = async (e) => {
    e.preventDefault()
    
    if (!wonForm.won_value || parseFloat(wonForm.won_value) <= 0) {
      toast.error('Nilai deal aktual harus lebih dari 0')
      return
    }
    
    if (!wonForm.won_reason_category) {
      toast.error('Pilih kategori alasan menang')
      return
    }
    
    if (!wonForm.won_notes || wonForm.won_notes.length < 20) {
      toast.error('Catatan minimal 20 karakter')
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
    
    if (!lostForm.lost_notes || lostForm.lost_notes.length < 20) {
      toast.error('Catatan minimal 20 karakter')
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

  const getActivityIcon = (type) => {
    const icons = {
      telepon: '📞',
      whatsapp: '💬',
      email: '📧',
      visit: '📍',
      meeting: '👥',
      demo: '🖥️',
      kirim_penawaran: '📄',
      revisi_penawaran: '✏️',
      lainnya: '📝'
    }
    return icons[type] || '📝'
  }

  const getActivityLabel = (type) => {
    const labels = {
      telepon: 'Telepon',
      whatsapp: 'WhatsApp',
      email: 'Email',
      visit: 'Visit',
      meeting: 'Meeting',
      demo: 'Demo Produk',
      kirim_penawaran: 'Kirim Penawaran',
      revisi_penawaran: 'Revisi Penawaran',
      lainnya: 'Lainnya'
    }
    return labels[type] || 'Unknown'
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

          {/* Notes & Competitor */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes & Competitor</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Initial Notes</p>
                <p className="text-sm text-gray-600">{funnel.initial_notes}</p>
              </div>
              
              {funnel.competitor_name && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Competitor</p>
                  <p className="text-sm text-gray-900">{funnel.competitor_name}</p>
                  {funnel.competitor_notes && (
                    <p className="text-sm text-gray-600 mt-1">{funnel.competitor_notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activities Timeline */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
              {funnel.status === 'open' && (
                <Button size="sm" onClick={() => setShowActivityForm(!showActivityForm)}>
                  <Plus size={14} />
                  Add Activity
                </Button>
              )}
            </div>

            {/* Add Activity Form */}
            {showActivityForm && (
              <form onSubmit={handleAddActivity} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                    <select
                      value={activityForm.activity_type}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, activity_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="telepon">Telepon</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="visit">Visit</option>
                      <option value="meeting">Meeting</option>
                      <option value="demo">Demo Produk</option>
                      <option value="kirim_penawaran">Kirim Penawaran</option>
                      <option value="revisi_penawaran">Revisi Penawaran</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={activityForm.activity_date}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, activity_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (min 10 chars)</label>
                  <textarea
                    value={activityForm.notes}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Detail aktivitas..."
                    required
                    minLength={10}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Stage (Optional)</label>
                    <select
                      value={activityForm.new_stage}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, new_stage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">No Change</option>
                      <option value="prospek">Prospek</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negosiasi">Negosiasi</option>
                      <option value="closing">Closing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Probability (Optional)</label>
                    <select
                      value={activityForm.new_probability}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, new_probability: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">No Change</option>
                      <option value="low">Low</option>
                      <option value="middle">Middle</option>
                      <option value="high">High</option>
                      <option value="very_high">Very High</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700">
                    Save Activity
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowActivityForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="text-gray-300 mx-auto mb-2" size={32} />
                  <p className="text-gray-500 text-sm">Belum ada activity</p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-lg">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{getActivityLabel(activity.activity_type)}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.activity_date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.notes}</p>
                      {(activity.previous_stage && activity.new_stage) && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Stage:</span>
                          {getDealStageBadge(activity.previous_stage)}
                          <span className="text-gray-400">→</span>
                          {getDealStageBadge(activity.new_stage)}
                        </div>
                      )}
                      {(activity.previous_probability && activity.new_probability) && (
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="text-gray-500">Probability:</span>
                          {getWinProbabilityBadge(activity.previous_probability)}
                          <span className="text-gray-400">→</span>
                          {getWinProbabilityBadge(activity.new_probability)}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">by {activity.creator?.name}</p>
                    </div>
                  </div>
                ))
              )}
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
                  <p className="text-xs text-green-700">Won Value</p>
                  <p className="text-lg font-bold text-green-900">
                    Rp {Number(funnel.won_value).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Reason</p>
                  <p className="text-sm text-green-900 capitalize">{funnel.won_reason_category?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Notes</p>
                  <p className="text-sm text-green-900">{funnel.won_notes}</p>
                </div>
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
                <div>
                  <p className="text-xs text-red-700">Notes</p>
                  <p className="text-sm text-red-900">{funnel.lost_notes}</p>
                </div>
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
                    Nilai Deal Aktual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={wonForm.won_value}
                    onChange={(e) => setWonForm(prev => ({ ...prev, won_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="450000000"
                    min="0"
                    step="1000"
                    required
                  />
                  {wonForm.won_value && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      Rp {Number(wonForm.won_value).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

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
                    Catatan (min 20 chars) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={wonForm.won_notes}
                    onChange={(e) => setWonForm(prev => ({ ...prev, won_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Jelaskan kenapa menang..."
                    required
                    minLength={20}
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
                    Catatan (min 20 chars) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={lostForm.lost_notes}
                    onChange={(e) => setLostForm(prev => ({ ...prev, lost_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Jelaskan kenapa kalah..."
                    required
                    minLength={20}
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
