import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MapPin, User, Edit, Trash2, Eye, Clock, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import CameraAttendance from '../components/ui/CameraAttendance'
import '../styles/responsive-global.css'

export default function PlanVisitsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [planVisits, setPlanVisits] = useState([])
  const [customers, setCustomers] = useState([])
  const [salesUsers, setSalesUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingVisit, setCompletingVisit] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [completeFormData, setCompleteFormData] = useState({
    hasil_visit: '',
    completion_photo: null
  })
  const [formData, setFormData] = useState({
    customer_id: '',
    assigned_to: '',
    tanggal_visit: new Date().toISOString().split('T')[0],
    waktu_visit: '',
    lokasi: '',
    tujuan: '',
    catatan: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [visitsResponse, customersResponse, salesResponse] = await Promise.allSettled([
        api.getPlanVisits({ search: searchQuery }),
        api.getCustomers(),
        can(user, 'assign_visits') ? api.getSalesUsers() : Promise.resolve({ data: [] })
      ])
      
      if (visitsResponse.status === 'fulfilled') {
        const visitsData = visitsResponse.value.data?.data || visitsResponse.value.data || []
        setPlanVisits(Array.isArray(visitsData) ? visitsData : [])
      }
      
      if (customersResponse.status === 'fulfilled') {
        const customersData = customersResponse.value.data?.data || customersResponse.value.data || []
        setCustomers(Array.isArray(customersData) ? customersData : [])
      }
      
      if (salesResponse.status === 'fulfilled') {
        const salesData = salesResponse.value.data || []
        setSalesUsers(Array.isArray(salesData) ? salesData : [])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = { ...formData }
      
      if (user.role === 'sales' && !submitData.assigned_to) {
        submitData.assigned_to = user.id
      }
      
      if (editingVisit) {
        await api.updatePlanVisit(editingVisit.id, submitData)
        toast.success('Plan visit berhasil diperbarui')
      } else {
        await api.createPlanVisit(submitData)
        toast.success('Plan visit berhasil ditambahkan')
      }
      
      setShowAddForm(false)
      setEditingVisit(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan plan visit')
    }
  }

  const handleEdit = (visit) => {
    setEditingVisit(visit)
    setFormData({
      customer_id: visit.customer_id || '',
      assigned_to: visit.assigned_to || '',
      tanggal_visit: visit.tanggal_visit ? visit.tanggal_visit.split('T')[0] : '',
      waktu_visit: visit.waktu_visit || '',
      lokasi: visit.lokasi || '',
      tujuan: visit.tujuan || '',
      catatan: visit.catatan || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (visit) => {
    if (!window.confirm(`Hapus plan visit ke ${visit.customer?.name}?`)) return
    
    try {
      await api.deletePlanVisit(visit.id)
      toast.success('Plan visit berhasil dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus plan visit')
    }
  }

  const handleCompleteVisit = async (visit) => {
    setCompletingVisit(visit)
    setCompleteFormData({
      hasil_visit: '',
      completion_photo: null
    })
    setShowCompleteModal(true)
  }

  const handleCameraCapture = (photoData) => {
    // Convert base64 to file-like object for upload
    setCompleteFormData(prev => ({
      ...prev,
      completion_photo: photoData.photo
    }))
    setShowCamera(false)
    toast.success('Foto berhasil diambil!')
  }

  const handleCameraCancel = () => {
    setShowCamera(false)
  }

  const handleCompleteSubmit = async (e) => {
    e.preventDefault()
    
    if (!completeFormData.hasil_visit.trim()) {
      toast.error('Hasil kunjungan harus diisi')
      return
    }
    
    try {
      await api.completePlanVisit(completingVisit.id, completeFormData)
      toast.success('Visit berhasil diselesaikan! Mengarahkan ke halaman realisasi visit...', {
        duration: 2000
      })
      setShowCompleteModal(false)
      setCompletingVisit(null)
      fetchData()
      
      // Redirect ke halaman Realisasi Visit setelah berhasil
      setTimeout(() => {
        navigate('/realisasi-visits')
      }, 1500) // Delay 1.5 detik untuk memberi waktu toast muncul
      
    } catch (error) {
      toast.error(error.message || 'Gagal menyelesaikan visit')
    }
  }

  const handleCustomerChange = (customerId) => {
    const selected = customers.find(c => c.id == customerId)
    if (selected) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        lokasi: selected.address || selected.alamat || '',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        lokasi: '',
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: '',
      assigned_to: '',
      tanggal_visit: new Date().toISOString().split('T')[0],
      waktu_visit: '',
      lokasi: '',
      tujuan: '',
      catatan: ''
    })
  }

  const getStatusClass = (visit) => {
    // Check if visit has been completed (has realisasi)
    if (visit.realisasi || visit.realisasiVisit || visit.realisasi_visit) {
      const status = visit.realisasi?.status || visit.realisasiVisit?.status || visit.realisasi_visit?.status
      return status === 'done' ? 'status-selesai' : 'status-dibatalkan'
    }
    
    const visitDate = new Date(visit.tanggal_visit)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (visitDate < today) {
      return 'status-berjalan'
    }
    
    return 'status-scheduled'
  }

  const getStatusText = (visit) => {
    // Check if visit has been completed (has realisasi)
    if (visit.realisasi || visit.realisasiVisit || visit.realisasi_visit) {
      const status = visit.realisasi?.status || visit.realisasiVisit?.status || visit.realisasi_visit?.status
      return status === 'done' ? 'Selesai' : 'Dibatalkan'
    }
    
    const visitDate = new Date(visit.tanggal_visit)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (visitDate < today) {
      return 'Sedang Berjalan'
    }
    
    return 'Direncanakan'
  }

  // Helper function to check if visit is completed - SIMPLIFIED
  const isVisitCompleted = (visit) => {
    return !!(visit.realisasiVisit || visit.realisasi_visit || visit.realisasi)
  }

  const getStatusBadge = (visit) => {
    const statusClass = getStatusClass(visit)
    const statusText = getStatusText(visit)
    
    return (
      <span className={`badge ${statusClass}`}>
        {statusText}
      </span>
    )
  }

  const getFilteredVisits = () => {
    let filtered = planVisits

    if (searchQuery.trim()) {
      filtered = filtered.filter(visit => 
        visit.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.customer?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.lokasi?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeFilter !== 'semua') {
      filtered = filtered.filter(visit => {
        const visitDate = new Date(visit.tanggal_visit)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isCompleted = isVisitCompleted(visit)

        switch (activeFilter) {
          case 'direncanakan':
            return !isCompleted && visitDate >= today
          case 'berjalan':
            return !isCompleted && visitDate < today
          case 'selesai':
            return isCompleted && (visit.realisasi?.status === 'done' || visit.realisasiVisit?.status === 'done' || visit.realisasi_visit?.status === 'done')
          case 'dibatalkan':
            return isCompleted && (visit.realisasi?.status === 'missed' || visit.realisasiVisit?.status === 'missed' || visit.realisasi_visit?.status === 'missed')
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filterTabs = [
    { key: 'semua', label: 'Semua', count: planVisits.length },
    { 
      key: 'direncanakan', 
      label: 'Direncanakan', 
      count: planVisits.filter(v => !isVisitCompleted(v) && new Date(v.tanggal_visit) >= new Date()).length 
    },
    { 
      key: 'berjalan', 
      label: 'Sedang Berjalan', 
      count: planVisits.filter(v => !isVisitCompleted(v) && new Date(v.tanggal_visit) < new Date()).length 
    },
    { 
      key: 'selesai', 
      label: 'Selesai', 
      count: planVisits.filter(v => {
        const isCompleted = isVisitCompleted(v)
        return isCompleted && (v.realisasi?.status === 'done' || v.realisasiVisit?.status === 'done' || v.realisasi_visit?.status === 'done')
      }).length 
    },
    { 
      key: 'dibatalkan', 
      label: 'Dibatalkan', 
      count: planVisits.filter(v => {
        const isCompleted = isVisitCompleted(v)
        return isCompleted && (v.realisasi?.status === 'missed' || v.realisasiVisit?.status === 'missed' || v.realisasi_visit?.status === 'missed')
      }).length 
    }
  ]

  const filteredVisits = getFilteredVisits()

  return (
    <div className="container-responsive spacing-md">
      {/* Header */}
      <div className="header-responsive">
        <div>
          <h1 className="header-title">Plan Visit</h1>
          <p className="header-subtitle">Kelola rencana kunjungan sales</p>
        </div>
        
        {user?.role === 'sales_manager' && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-responsive primary"
          >
            <Plus size={16} />
            <span className="mobile-hidden">Tambah Plan Visit</span>
            <span className="desktop-hidden tablet-hidden">Tambah</span>
          </button>
        )}
      </div>

      {/* Quick Actions untuk visit hari ini */}
      {(() => {
        const todayVisits = planVisits.filter(visit => {
          const visitDate = new Date(visit.tanggal_visit).toDateString()
          const today = new Date().toDateString()
          return visitDate === today && !isVisitCompleted(visit)
        })
        
        if (todayVisits.length > 0) {
          return (
            <div className="card-compact" style={{ background: '#f0f9ff', borderLeft: '4px solid #0ea5e9' }}>
              <h3 className="text-responsive-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Clock size={20} />
                Visit Hari Ini
              </h3>
              <div className="grid-responsive sm-2">
                {todayVisits.map(visit => (
                  <div key={visit.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-responsive-base font-medium text-gray-900 truncate">
                          {visit.customer?.name}
                        </h4>
                        <p className="text-responsive-sm text-gray-600">
                          {visit.waktu_visit || 'Waktu belum ditentukan'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteVisit(visit)}
                        className="btn-responsive primary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        ✓ <span className="mobile-hidden">Selesai</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Filter Tabs */}
      <div className="card-compact" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="flex overflow-x-auto">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-shrink-0 px-4 py-3 text-responsive-sm font-medium border-b-2 transition-colors ${
                activeFilter === tab.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="card-compact" style={{ padding: '12px' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari customer, perusahaan, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-responsive pl-10"
          />
        </div>
      </div>

      {/* Visit Cards */}
      {loading ? (
        <div className="loading-responsive">
          <div className="loading-spinner-responsive"></div>
          <span className="text-responsive-sm text-gray-600">Memuat data...</span>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="empty-state-responsive">
          <Calendar className="icon" size={48} />
          <h3 className="title">Belum ada plan visit</h3>
          <p className="description">
            {searchQuery ? 'Tidak ada hasil yang sesuai dengan pencarian' : 'Mulai dengan menambahkan plan visit baru'}
          </p>
          {user?.role === 'sales_manager' && !searchQuery && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-responsive primary"
              style={{ marginTop: '16px' }}
            >
              <Plus size={16} />
              Tambah Plan Visit Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid-responsive sm-2 lg-4">
          {filteredVisits.map(visit => (
            <div key={visit.id} className="card-compact">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-responsive-base font-semibold text-gray-900 truncate">
                    {visit.customer?.name}
                  </h3>
                  <p className="text-responsive-sm text-gray-600 truncate">
                    {visit.customer?.company}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${
                  getStatusClass(visit) === 'status-selesai' ? 'bg-green-100 text-green-700' :
                  getStatusClass(visit) === 'status-berjalan' ? 'bg-yellow-100 text-yellow-700' :
                  getStatusClass(visit) === 'status-dibatalkan' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {getStatusText(visit)}
                </span>
              </div>

              <div className="border-t border-gray-100 my-3"></div>

              {/* Visit Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-responsive-sm text-gray-700 truncate">
                    {new Date(visit.tanggal_visit).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                {visit.waktu_visit && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-responsive-sm text-gray-700">{visit.waktu_visit}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-responsive-sm text-gray-700 truncate" title={visit.lokasi}>
                    {visit.lokasi}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-responsive-sm text-gray-700 truncate">
                    {visit.assigned_to_user?.name || visit.assignedUser?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Purpose */}
              {visit.tujuan && (
                <div className="mb-4 p-2 bg-gray-50 rounded-md">
                  <div className="text-responsive-xs font-medium text-gray-700 mb-1">Tujuan:</div>
                  <p className="text-responsive-sm text-gray-600 line-clamp-2">{visit.tujuan}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button className="btn-responsive secondary flex-1 min-w-0">
                  <Eye size={14} />
                  <span className="mobile-hidden">Detail</span>
                </button>
                
                {/* Button Selesaikan - hanya muncul untuk visit yang belum selesai */}
                {!isVisitCompleted(visit) && (
                  <button
                    onClick={() => handleCompleteVisit(visit)}
                    className="btn-responsive primary flex-1 min-w-0"
                    title="Selesaikan visit ini dan buat realisasi visit"
                  >
                    ✓ <span className="mobile-hidden">Selesai</span>
                  </button>
                )}
                
                {can(user, 'edit_plan_visit') && (
                  <button
                    onClick={() => handleEdit(visit)}
                    className="btn-responsive secondary"
                  >
                    <Edit size={14} />
                  </button>
                )}
                
                {can(user, 'delete_plan_visit') && (
                  <button
                    onClick={() => handleDelete(visit)}
                    className="btn-responsive danger"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Visit Modal */}
      {showCompleteModal && completingVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="spacing-lg border-b border-gray-200">
              <h2 className="text-responsive-xl font-semibold text-gray-900">Selesaikan Kunjungan</h2>
              <div className="mt-2">
                <h4 className="text-responsive-base font-medium text-gray-800">{completingVisit.customer?.name}</h4>
                <p className="text-responsive-sm text-gray-600">{completingVisit.customer?.company}</p>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-responsive-sm text-blue-800">
                  Setelah menyelesaikan visit, Anda akan diarahkan ke halaman Realisasi Visit untuk melihat hasil kunjungan.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleCompleteSubmit} className="spacing-lg">
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Hasil Kunjungan *</label>
                <textarea
                  value={completeFormData.hasil_visit}
                  onChange={(e) => setCompleteFormData(prev => ({ ...prev, hasil_visit: e.target.value }))}
                  className="input-responsive"
                  style={{ minHeight: '80px' }}
                  placeholder="Jelaskan hasil kunjungan, kesepakatan, atau hal penting lainnya..."
                  required
                />
              </div>

              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Upload Foto Bukti (Opsional)</label>
                <div className="mt-2">
                  {completeFormData.completion_photo ? (
                    <div className="space-y-3">
                      <img 
                        src={completeFormData.completion_photo} 
                        alt="Foto bukti visit" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="btn-responsive secondary flex-1"
                        >
                          <Camera size={16} />
                          Ambil Ulang
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompleteFormData(prev => ({ ...prev, completion_photo: null }))}
                          className="btn-responsive danger flex-1"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      <Camera size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-responsive-sm text-gray-600">Ambil Foto dengan Kamera</p>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" className="btn-responsive primary flex-1">
                  ✓ Selesai & Lihat Realisasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false)
                    setCompletingVisit(null)
                  }}
                  className="btn-responsive secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="spacing-lg border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-responsive-xl font-semibold text-gray-900">
                {editingVisit ? 'Edit Plan Visit' : 'Tambah Plan Visit'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingVisit(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="spacing-lg">
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="input-responsive"
                  required
                >
                  <option value="">Pilih Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.company}
                    </option>
                  ))}
                </select>
              </div>

              {can(user, 'assign_visits') && (
                <div className="form-group-responsive">
                  <label className="text-responsive-sm font-medium text-gray-700">Assign To Sales</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="input-responsive"
                    required
                  >
                    <option value="">Pilih Sales</option>
                    {salesUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'sales_manager' ? 'Sales Manager' : 'Sales'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-row-responsive sm-2">
                <div className="form-group-responsive">
                  <label className="text-responsive-sm font-medium text-gray-700">Tanggal Visit</label>
                  <input
                    type="date"
                    value={formData.tanggal_visit}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal_visit: e.target.value }))}
                    className="input-responsive"
                  />
                </div>
                
                <div className="form-group-responsive">
                  <label className="text-responsive-sm font-medium text-gray-700">Waktu Visit</label>
                  <input
                    type="time"
                    value={formData.waktu_visit}
                    onChange={(e) => setFormData(prev => ({ ...prev, waktu_visit: e.target.value }))}
                    className="input-responsive"
                  />
                </div>
              </div>
              
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Lokasi</label>
                <input
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
                  placeholder="Alamat lokasi visit"
                  className="input-responsive"
                  required
                />
              </div>
              
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Tujuan Visit</label>
                <input
                  type="text"
                  value={formData.tujuan}
                  onChange={(e) => setFormData(prev => ({ ...prev, tujuan: e.target.value }))}
                  placeholder="Tujuan kunjungan"
                  className="input-responsive"
                  required
                />
              </div>
              
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Catatan</label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="input-responsive"
                  style={{ minHeight: '80px' }}
                  placeholder="Catatan tambahan"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" className="btn-responsive primary flex-1">
                  {editingVisit ? 'Perbarui' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingVisit(null)
                    resetForm()
                  }}
                  className="btn-responsive secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Component */}
      {showCamera && (
        <CameraAttendance
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
          type="visit-photo"
        />
      )}
    </div>
  )
}