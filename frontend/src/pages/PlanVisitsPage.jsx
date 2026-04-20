import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MapPin, User, Edit, Trash2, Eye, Clock, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import CameraAttendance from '../components/ui/CameraAttendance'
import '../styles/plan-visits-professional.css'

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
    <div className="plan-visits-container">
      {/* Header */}
      <div className="plan-visits-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="plan-visits-title">Plan Visit Management</h1>
            <p className="plan-visits-subtitle">
              Kelola rencana kunjungan sales dengan sistem yang profesional dan efisien
            </p>
          </div>
          
          {user?.role === 'sales_manager' && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-action btn-complete"
            >
              <Plus size={16} />
              Tambah Plan Visit
            </button>
          )}
        </div>
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
            <div className="quick-actions-container">
              <h3 className="quick-actions-title">Visit Hari Ini</h3>
              <div className="quick-actions-grid">
                {todayVisits.map(visit => (
                  <div key={visit.id} className="quick-action-card">
                    <div className="quick-action-info">
                      <h4>{visit.customer?.name}</h4>
                      <p>{visit.waktu_visit || 'Waktu belum ditentukan'}</p>
                    </div>
                    <button
                      onClick={() => handleCompleteVisit(visit)}
                      className="btn-quick-complete"
                    >
                      ✓ Selesai Sekarang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Filter Tabs */}
      <div className="filter-tabs-container">
        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Cari customer, perusahaan, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Visit Cards */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">Memuat data...</span>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="empty-state">
          <Calendar className="empty-icon" size={48} />
          <h3 className="empty-title">Belum ada plan visit</h3>
          <p className="empty-description">
            {searchQuery ? 'Tidak ada hasil yang sesuai dengan pencarian' : 'Mulai dengan menambahkan plan visit baru'}
          </p>
          {user?.role === 'sales_manager' && !searchQuery && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-action btn-complete"
            >
              <Plus size={16} />
              Tambah Plan Visit Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="plan-visits-grid">
          {filteredVisits.map(visit => (
            <div key={visit.id} className="plan-visit-card">
              {/* Card Header */}
              <div className="card-header">
                <div className="customer-info">
                  <h3 className="customer-name">{visit.customer?.name}</h3>
                  <p className="customer-company">{visit.customer?.company}</p>
                </div>
                <span className={`status-badge ${getStatusClass(visit)}`}>
                  {getStatusText(visit)}
                </span>
              </div>

              <div className="card-divider"></div>

              {/* Visit Details */}
              <div className="visit-details">
                <div className="detail-row">
                  <Calendar size={14} className="detail-icon" />
                  <span className="detail-text">
                    {new Date(visit.tanggal_visit).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                {visit.waktu_visit && (
                  <div className="detail-row">
                    <Clock size={14} className="detail-icon" />
                    <span className="detail-text">{visit.waktu_visit}</span>
                  </div>
                )}

                <div className="detail-row">
                  <MapPin size={14} className="detail-icon" />
                  <span className="detail-text">{visit.lokasi}</span>
                </div>

                <div className="detail-row">
                  <User size={14} className="detail-icon" />
                  <span className="detail-text">
                    {visit.assigned_to_user?.name || visit.assignedUser?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Purpose */}
              {visit.tujuan && (
                <div className="purpose-section">
                  <div className="purpose-label">Tujuan:</div>
                  <p className="purpose-text">{visit.tujuan}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-action btn-detail">
                  <Eye size={14} />
                  Detail
                </button>
                
                {/* Button Selesaikan - hanya muncul untuk visit yang belum selesai */}
                {!isVisitCompleted(visit) && (
                  <button
                    onClick={() => handleCompleteVisit(visit)}
                    className="btn-action btn-complete"
                    title="Selesaikan visit ini dan buat realisasi visit"
                  >
                    ✓ Selesai
                  </button>
                )}
                
                {can(user, 'edit_plan_visit') && (
                  <button
                    onClick={() => handleEdit(visit)}
                    className="btn-action btn-edit"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                )}
                
                {can(user, 'delete_plan_visit') && (
                  <button
                    onClick={() => handleDelete(visit)}
                    className="btn-action btn-delete"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Selesaikan Kunjungan</h2>
              <div className="modal-customer-info">
                <h4 className="modal-customer-name">{completingVisit.customer?.name}</h4>
                <p className="modal-customer-company">{completingVisit.customer?.company}</p>
              </div>
              <div className="modal-info-notice">
                <p>Setelah menyelesaikan visit, Anda akan diarahkan ke halaman Realisasi Visit untuk melihat hasil kunjungan.</p>
              </div>
            </div>
            
            <form onSubmit={handleCompleteSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Hasil Kunjungan *</label>
                <textarea
                  value={completeFormData.hasil_visit}
                  onChange={(e) => setCompleteFormData(prev => ({ ...prev, hasil_visit: e.target.value }))}
                  className="form-textarea"
                  placeholder="Jelaskan hasil kunjungan, kesepakatan, atau hal penting lainnya..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Foto Bukti (Opsional)</label>
                <div className="photo-upload-container">
                  {completeFormData.completion_photo ? (
                    <div className="photo-preview">
                      <img 
                        src={completeFormData.completion_photo} 
                        alt="Foto bukti visit" 
                        className="photo-preview-image"
                      />
                      <div className="photo-actions">
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="btn-photo btn-retake"
                        >
                          <Camera size={16} />
                          Ambil Ulang
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompleteFormData(prev => ({ ...prev, completion_photo: null }))}
                          className="btn-photo btn-remove"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="photo-upload"
                    >
                      <Camera size={24} className="detail-icon" />
                      <p className="photo-upload-text">Ambil Foto dengan Kamera</p>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn-modal btn-modal-primary">
                  ✓ Selesai & Lihat Realisasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false)
                    setCompletingVisit(null)
                  }}
                  className="btn-modal btn-modal-secondary"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingVisit ? 'Edit Plan Visit' : 'Tambah Plan Visit'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingVisit(null)
                  resetForm()
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="form-input form-select"
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
                <div className="form-group">
                  <label className="form-label">Assign To Sales</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="form-input form-select"
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tanggal Visit</label>
                  <input
                    type="date"
                    value={formData.tanggal_visit}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal_visit: e.target.value }))}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Waktu Visit</label>
                  <input
                    type="time"
                    value={formData.waktu_visit}
                    onChange={(e) => setFormData(prev => ({ ...prev, waktu_visit: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Lokasi</label>
                <input
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
                  placeholder="Alamat lokasi visit"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Tujuan Visit</label>
                <input
                  type="text"
                  value={formData.tujuan}
                  onChange={(e) => setFormData(prev => ({ ...prev, tujuan: e.target.value }))}
                  placeholder="Tujuan kunjungan"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="Catatan tambahan"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" className="btn-professional btn-primary flex-1">
                  {editingVisit ? 'Perbarui' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingVisit(null)
                    resetForm()
                  }}
                  className="btn-professional btn-secondary"
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