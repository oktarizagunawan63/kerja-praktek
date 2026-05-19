import { useState, useEffect } from 'react'
import { MapPin, CheckCircle, XCircle, Clock, Navigation, Plus, Camera, X, Calendar } from '@icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import CameraAttendance from '../components/ui/CameraAttendance'
import toast from 'react-hot-toast'
import '../styles/realisasi-visits.css'

// GPS Helper Functions
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c * 1000 // Distance in meters
}

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        // Silent error handling - don't log to console
        let message = 'Gagal mendapatkan lokasi'
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Akses lokasi ditolak. Mohon izinkan akses lokasi.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Lokasi tidak tersedia'
            break
          case error.TIMEOUT:
            message = 'Timeout mendapatkan lokasi'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

const VISIT_OUTCOME_META = {
  closed: { label: 'Closed / Deal', className: 'bg-green-100 text-green-700' },
  follow_up: { label: 'Follow-up', className: 'bg-blue-100 text-blue-700' },
  not_interested: { label: 'Tidak Tertarik', className: 'bg-red-100 text-red-700' },
  rescheduled: { label: 'Dijadwal Ulang', className: 'bg-amber-100 text-amber-700' },
}

export default function RealisasiVisitsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pending') // pending, unplanned-approval, my-unplanned, history
  const [pendingVisits, setPendingVisits] = useState([])
  const [pendingUnplannedVisits, setPendingUnplannedVisits] = useState([])
  const [myUnplannedVisits, setMyUnplannedVisits] = useState([])
  const [realisasiVisits, setRealisasiVisits] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [showUnplannedForm, setShowUnplannedForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [rescheduleVisit, setRescheduleVisit] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ tanggal_visit: '', waktu_visit: '', catatan: '' })
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    meeting_notes: '',
    visit_outcome: '',
    hasil_visit: '',
    catatan: '',
    foto_bukti: null,
    status: 'done'
  })
  const [unplannedFormData, setUnplannedFormData] = useState({
    customer_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    visit_purpose: '',
    meeting_notes: '',
    visit_outcome: '',
    photo: null
  })
  const [showCamera, setShowCamera] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Check if user has permission to access realisasi visits
    if (!can(user, 'view_visit_relations')) {
      return
    }
    
    fetchData()
    if (can(user, 'create_realisasi_visit')) {
      fetchCustomers()
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch pending visits (plan visits belum dikunjungi)
      try {
        const pendingResponse = await api.getPendingVisits()
        const pendingData = pendingResponse.data?.data || pendingResponse.data || []
        setPendingVisits(Array.isArray(pendingData) ? pendingData : [])
      } catch (error) {
        console.warn('Pending visits API failed:', error.message)
        setPendingVisits([])
      }
      
      // Fetch pending unplanned visits for Sales Manager
      if (user?.role === 'sales_manager' || user?.role === 'administrator') {
        try {
          const pendingUnplannedResponse = await api.getPendingUnplannedVisits()
          const pendingUnplannedData = pendingUnplannedResponse.data?.data || pendingUnplannedResponse.data || []
          setPendingUnplannedVisits(Array.isArray(pendingUnplannedData) ? pendingUnplannedData : [])
        } catch (error) {
          console.warn('Pending unplanned visits API failed:', error.message)
          setPendingUnplannedVisits([])
        }
      }
      
      // Fetch my unplanned visits for Sales
      if (user?.role === 'sales') {
        try {
          const myUnplannedResponse = await api.getMyUnplannedVisits()
          const myUnplannedData = myUnplannedResponse.data?.data || myUnplannedResponse.data || []
          setMyUnplannedVisits(Array.isArray(myUnplannedData) ? myUnplannedData : [])
        } catch (error) {
          console.warn('My unplanned visits API failed:', error.message)
          setMyUnplannedVisits([])
        }
      }
      
      // Fetch realisasi visits (completed visits - riwayat)
      try {
        const realisasiResponse = await api.getRealisasiVisits()
        const realisasiData = realisasiResponse.data?.data || realisasiResponse.data || []
        setRealisasiVisits(Array.isArray(realisasiData) ? realisasiData : [])
      } catch (error) {
        console.warn('Realisasi visits API failed:', error.message)
        setRealisasiVisits([])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't show toast error for data loading issues
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.getCustomers()
      const customerData = response.data?.data || response.data || []
      // Show ALL customers (including pending) for visit creation
      const allCustomers = Array.isArray(customerData) ? customerData : []
      setCustomers(allCustomers)
    } catch (error) {
      console.warn('Customers API failed:', error.message)
      setCustomers([])
    }
  }

  const handleStartVisit = async (visit) => {
    try {
      setLocationLoading(true)
      toast.loading('Mendapatkan lokasi Anda...', { id: 'location' })
      
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      
      // Distance is informational only. The photo/GPS coordinates are the visit proof.
      if (visit.customer?.latitude && visit.customer?.longitude) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          parseFloat(visit.customer.latitude),
          parseFloat(visit.customer.longitude)
        )
        
        toast.success(`Lokasi tersimpan (${Math.round(distance)}m dari titik customer)`, { id: 'location' })
      } else {
        toast.success('Lokasi berhasil didapatkan', { id: 'location' })
      }
      
      setSelectedVisit(visit)
      setShowVisitForm(true)
      
    } catch (error) {
      toast.error(error.message, { id: 'location' })
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSubmitVisit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (submitting) return
    
    if (!currentLocation) {
      toast.error('Lokasi belum terdeteksi')
      return
    }
    
    // Validations
    if (!formData.visit_date) {
      toast.error('Tanggal visit wajib diisi')
      return
    }
    
    if (!formData.meeting_notes || formData.meeting_notes.length < 10) {
      toast.error('Meeting notes minimal 10 karakter')
      return
    }
    
    if (!formData.visit_outcome) {
      toast.error('Pilih hasil visit')
      return
    }
    
    // Validate visit date not in future
    const visitDate = new Date(formData.visit_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (visitDate > today) {
      toast.error('Tanggal visit tidak boleh di masa depan')
      return
    }
    
    // Validate photo is captured
    if (!formData.foto_bukti) {
      toast.error('Foto bukti visit wajib diambil')
      return
    }
    
    try {
      setSubmitting(true)
      
      const submitData = {
        plan_visit_id: selectedVisit.id,
        visit_date: formData.visit_date,
        meeting_notes: formData.meeting_notes,
        visit_outcome: formData.visit_outcome,
        catatan: formData.catatan,
        status: formData.visit_outcome === 'closed' ? 'done' : 
                formData.visit_outcome === 'missed' ? 'missed' : 'done',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        photos: [formData.foto_bukti],
        visited_at: new Date().toISOString()
      }
      
      await api.createRealisasiVisit(submitData)
      toast.success('Realisasi visit berhasil disimpan')
      
      setShowVisitForm(false)
      setSelectedVisit(null)
      setCurrentLocation(null)
      setFormData({
        visit_date: new Date().toISOString().split('T')[0],
        meeting_notes: '',
        visit_outcome: '',
        catatan: '',
        foto_bukti: null,
        status: 'done'
      })
      
      fetchData()
      
    } catch (error) {
      console.error('Submit visit error:', error)
      toast.error(error.message || 'Gagal menyimpan realisasi visit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsMissed = async (visit) => {
    if (!window.confirm(`Tandai visit ke ${visit.customer?.name} sebagai terlewat? Visit akan ditutup sebagai tidak terlaksana dan tidak muncul lagi di pending visit.`)) return
    
    try {
      // visit.id is the plan_visit_id from pending visits
      await api.markVisitAsMissed(visit.id)
      toast.success('Visit ditandai sebagai terlewat')
      fetchData()
    } catch (error) {
      console.error('Mark as missed error:', error)
      toast.error(error.message || 'Gagal menandai visit sebagai terlewat')
    }
  }

  const handleApproveUnplanned = async (visitId) => {
    if (!window.confirm('Approve unplanned visit ini?')) return
    
    try {
      await api.approveUnplannedVisit(visitId)
      toast.success('Unplanned visit berhasil diapprove')
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal approve unplanned visit')
    }
  }

  const handleRejectUnplanned = async (visitId) => {
    const reason = window.prompt('Alasan reject:')
    if (!reason) return
    
    try {
      await api.rejectUnplannedVisit(visitId, reason)
      toast.success('Unplanned visit berhasil direject')
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal reject unplanned visit')
    }
  }

  const getStatusBadge = (status, type = 'planned') => {
    const badges = {
      done: 'bg-green-100 text-green-700',
      missed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700'
    }
    
    const labels = {
      done: type === 'unplanned' ? 'Terealisasi' : 'Selesai',
      missed: 'Terlewat',
      pending: 'Pending'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const openRescheduleModal = (visit) => {
    setRescheduleVisit(visit)
    setRescheduleForm({
      tanggal_visit: visit.tanggal_visit || new Date().toISOString().split('T')[0],
      waktu_visit: visit.waktu_visit || '',
      catatan: visit.catatan || '',
    })
  }

  const handleRescheduleVisit = async (e) => {
    e.preventDefault()

    if (!rescheduleVisit) return
    if (!rescheduleForm.tanggal_visit) {
      toast.error('Tanggal baru wajib diisi')
      return
    }

    try {
      setSubmitting(true)
      const existingNote = rescheduleVisit.catatan || ''
      const rescheduleNote = `Reschedule dari ${rescheduleVisit.tanggal_visit || '-'}${rescheduleVisit.waktu_visit ? ` ${rescheduleVisit.waktu_visit}` : ''}`
      const nextNote = [existingNote, rescheduleNote, rescheduleForm.catatan]
        .map(value => String(value || '').trim())
        .filter(Boolean)
        .join('\n')

      await api.updatePlanVisit(rescheduleVisit.id, {
        tanggal_visit: rescheduleForm.tanggal_visit,
        waktu_visit: rescheduleForm.waktu_visit,
        catatan: nextNote,
      })

      toast.success('Jadwal visit berhasil di-reschedule')
      setRescheduleVisit(null)
      setRescheduleForm({ tanggal_visit: '', waktu_visit: '', catatan: '' })
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal reschedule visit')
    } finally {
      setSubmitting(false)
    }
  }

  const getOutcomeBadge = (outcome) => {
    const meta = VISIT_OUTCOME_META[outcome] || {
      label: outcome || '-',
      className: 'bg-gray-100 text-gray-700',
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${meta.className}`}>
        {meta.label}
      </span>
    )
  }

  const getApprovalBadge = (approvalStatus) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    
    const labels = {
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[approvalStatus] || badges.pending}`}>
        {labels[approvalStatus] || approvalStatus}
      </span>
    )
  }

  const pendingColumns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (visit) => (
        <div>
          <p className="font-medium text-gray-900">{visit.customer?.name}</p>
          <p className="text-sm text-gray-500">{visit.customer?.company}</p>
        </div>
      )
    },
    {
      key: 'schedule',
      label: 'Jadwal',
      render: (visit) => (
        <div>
          <p className="text-sm font-medium">
            {new Date(visit.tanggal_visit).toLocaleDateString('id-ID')}
          </p>
          {visit.waktu_visit && (
            <p className="text-xs text-gray-500">{visit.waktu_visit}</p>
          )}
        </div>
      )
    },
    {
      key: 'location',
      label: 'Lokasi',
      render: (visit) => (
        <div className="flex items-start gap-1">
          <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
          <span className="text-sm text-gray-600">{visit.lokasi}</span>
        </div>
      )
    },
    {
      key: 'purpose',
      label: 'Tujuan',
      render: (visit) => (
        <span className="text-sm text-gray-600">{visit.tujuan}</span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (visit) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openRescheduleModal(visit)}
            className="text-amber-700 border-amber-200 hover:bg-amber-50"
          >
            <Calendar size={14} />
            Reschedule
          </Button>
          <Button
            size="sm"
            onClick={() => handleStartVisit(visit)}
            disabled={locationLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Navigation size={14} />
            Mulai Visit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMarkAsMissed(visit)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle size={14} />
            Terlewat
          </Button>
        </div>
      )
    }
  ]

  const realisasiColumns = [
    {
      key: 'type',
      label: 'Type',
      render: (realisasi) => (
        <div className="flex flex-col gap-1 min-w-[100px]">
          {realisasi.type === 'unplanned' ? (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
              Unplanned
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
              Planned
            </span>
          )}
          {realisasi.type === 'unplanned' && realisasi.approval_status && (
            getApprovalBadge(realisasi.approval_status)
          )}
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (realisasi) => (
        <div className="min-w-[180px]">
          <p className="font-medium text-gray-900">
            {realisasi.type === 'unplanned' 
              ? realisasi.directCustomer?.name || realisasi.customer_name
              : realisasi.plan_visit?.customer?.name || realisasi.customer_name}
          </p>
          <p className="text-sm text-gray-500">
            {realisasi.type === 'unplanned'
              ? realisasi.directCustomer?.company || realisasi.customer_company
              : realisasi.plan_visit?.customer?.company || realisasi.customer_company}
          </p>
        </div>
      )
    },
    {
      key: 'visited_at',
      label: 'Waktu Visit',
      render: (realisasi) => {
        const dateValue = realisasi.visit_date || realisasi.visit_time || realisasi.created_at
        const timeValue = realisasi.visit_time 
          ? (typeof realisasi.visit_time === 'string' && realisasi.visit_time.includes(':') 
              ? realisasi.visit_time 
              : new Date(realisasi.visit_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
          : null
        
        return (
          <div className="min-w-[140px]">
            <p className="text-sm font-medium">
              {dateValue ? new Date(dateValue).toLocaleDateString('id-ID') : '-'}
            </p>
            <p className="text-xs text-gray-500">
              {timeValue || '-'}
            </p>
          </div>
        )
      }
    },
    {
      key: 'hasil_visit',
      label: 'Hasil Visit',
      render: (realisasi) => {
        const hasil = realisasi.meeting_notes || 
                     realisasi.visit_purpose || 
                     realisasi.notes ||
                     '-'
        
        return (
          <div className="min-w-[200px] max-w-[300px]">
            <p className="text-sm text-gray-900 line-clamp-2">
              {hasil}
            </p>
          </div>
        )
      }
    },
    {
      key: 'gps',
      label: 'GPS Coordinates',
      render: (realisasi) => {
        const hasGPS = realisasi.latitude && realisasi.longitude
        
        return (
          <div className="min-w-[150px]">
            {hasGPS ? (
              <p className="text-xs font-mono text-gray-700">
                {parseFloat(realisasi.latitude).toFixed(6)}, {parseFloat(realisasi.longitude).toFixed(6)}
              </p>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'photo',
      label: 'Foto',
      render: (realisasi) => {
        const hasPhoto = realisasi.photos && (Array.isArray(realisasi.photos) ? realisasi.photos.length > 0 : true)
        
        return (
          <div className="min-w-[100px]">
            {hasPhoto ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedPhoto(realisasi)
                  setShowPhotoModal(true)
                }}
              >
                <Camera size={14} />
                Lihat Foto
              </Button>
            ) : (
              <span className="text-xs text-gray-400">Tidak ada foto</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (realisasi) => (
        <div className="flex min-w-[110px] flex-col gap-1">
          {realisasi.type === 'unplanned' && realisasi.visit_outcome
            ? getOutcomeBadge(realisasi.visit_outcome)
            : getStatusBadge(realisasi.status, realisasi.type)}
          {realisasi.type === 'unplanned' && getStatusBadge(realisasi.status, realisasi.type)}
        </div>
      )
    }
  ]

  // Check permissions first
  if (!can(user, 'view_visit_relations')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You do not have permission to access visit management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Realisasi Visit</h1>
          <p className="text-gray-600">Lakukan kunjungan ke customer dengan GPS tracking</p>
        </div>
        {can(user, 'create_realisasi_visit') && (
          <Button
            onClick={async () => {
              try {
                setLocationLoading(true)
                toast.loading('Mendapatkan lokasi...', { id: 'unplanned-location' })
                const location = await getCurrentLocation()
                setCurrentLocation(location)
                toast.success('Lokasi berhasil didapatkan', { id: 'unplanned-location' })
                setShowUnplannedForm(true)
              } catch (error) {
                toast.error(error.message, { id: 'unplanned-location' })
              } finally {
                setLocationLoading(false)
              }
            }}
            disabled={locationLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} />
            Tambah Unplanned Visit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Visits
            {Array.isArray(pendingVisits) && pendingVisits.length > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                {pendingVisits.length}
              </span>
            )}
          </button>
          
          {user?.role === 'sales_manager' && (
            <button
              onClick={() => setActiveTab('unplanned-approval')}
              className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'unplanned-approval'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Unplanned Approval
              {pendingUnplannedVisits.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {pendingUnplannedVisits.length}
                </span>
              )}
            </button>
          )}
          
          {user?.role === 'sales' && (
            <button
              onClick={() => setActiveTab('my-unplanned')}
              className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'my-unplanned'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Unplanned Visits
              {myUnplannedVisits.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {myUnplannedVisits.length}
                </span>
              )}
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Riwayat Visit
          </button>
        </div>
      </div>

      {/* Pending Visits Tab */}
      {activeTab === 'pending' && (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-orange-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Pending Visits</h2>
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
            {Array.isArray(pendingVisits) ? pendingVisits.length : 0}
          </span>
        </div>
        
        <DataTable
          columns={pendingColumns}
          data={Array.isArray(pendingVisits) ? pendingVisits : []}
          loading={loading}
          emptyMessage="Tidak ada visit yang pending"
        />
      </div>
      )}

      {/* Pending Unplanned Visits - Sales Manager Only */}
      {activeTab === 'unplanned-approval' && user?.role === 'sales_manager' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-blue-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Pending Approval - Unplanned Visits</h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {pendingUnplannedVisits.length}
            </span>
          </div>
          
          <DataTable
            columns={[
              {
                key: 'customer',
                label: 'Customer',
                render: (visit) => (
                  <div>
                    <p className="font-medium text-gray-900">{visit.customer_name}</p>
                    <p className="text-sm text-gray-500">{visit.customer_company}</p>
                    <p className="text-xs text-gray-400">{visit.customer_phone}</p>
                  </div>
                )
              },
              {
                key: 'visit_info',
                label: 'Info Visit',
                render: (visit) => (
                  <div>
                    <p className="text-sm font-medium">
                      {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString('id-ID') : '-'}
                    </p>
                    <p className="text-xs text-gray-500">{visit.visit_time || '-'}</p>
                    <p className="text-xs text-gray-600 mt-1">{visit.visit_purpose}</p>
                  </div>
                )
              },
              {
                key: 'location',
                label: 'Lokasi GPS',
                render: (visit) => (
                  <div className="flex items-start gap-1">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600">
                      {visit.latitude && visit.longitude 
                        ? `${parseFloat(visit.latitude).toFixed(6)}, ${parseFloat(visit.longitude).toFixed(6)}`
                        : '-'}
                    </span>
                  </div>
                )
              },
              {
                key: 'sales',
                label: 'Sales',
                render: (visit) => (
                  <span className="text-sm text-gray-600">{visit.visitor?.name || '-'}</span>
                )
              },
              {
                key: 'actions',
                label: 'Aksi',
                render: (visit) => (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveUnplanned(visit.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectUnplanned(visit.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle size={14} />
                      Reject
                    </Button>
                  </div>
                )
              }
            ]}
            data={Array.isArray(pendingUnplannedVisits) ? pendingUnplannedVisits : []}
            loading={loading}
            emptyMessage="Tidak ada unplanned visit yang pending approval"
          />
        </div>
      )}

      {/* My Unplanned Visits - Sales Only */}
      {activeTab === 'my-unplanned' && user?.role === 'sales' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-blue-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">My Unplanned Visits</h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {myUnplannedVisits.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : !Array.isArray(myUnplannedVisits) || myUnplannedVisits.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MapPin className="text-gray-300 mx-auto mb-3" size={48} />
                <p className="text-gray-500">Belum ada unplanned visit</p>
              </div>
            ) : (
              myUnplannedVisits.map((visit) => (
                <div key={visit.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{visit.customer_name}</p>
                      <p className="text-sm text-gray-600">{visit.customer_company}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {visit.visit_outcome && getOutcomeBadge(visit.visit_outcome)}
                      {/* Approval Status Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        visit.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        visit.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {visit.approval_status === 'pending' ? 'Pending' :
                         visit.approval_status === 'approved' ? 'Approved' :
                         'Rejected'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><span className="font-medium">Date:</span> {new Date(visit.visit_date).toLocaleDateString('id-ID')}</p>
                    <p><span className="font-medium">Purpose:</span> {visit.visit_purpose}</p>
                    {visit.visit_outcome && (
                      <p><span className="font-medium">Outcome:</span> {VISIT_OUTCOME_META[visit.visit_outcome]?.label || visit.visit_outcome}</p>
                    )}
                  </div>
                  {visit.approval_status === 'rejected' && visit.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs font-medium text-red-700">Rejection Reason:</p>
                      <p className="text-xs text-red-600">{visit.rejection_reason}</p>
                    </div>
                  )}
                  {visit.approval_status === 'approved' && visit.approved_by && (
                    <div className="mt-2 text-xs text-green-600">
                      Approved by {visit.approved_by} on {new Date(visit.approved_at).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Completed Visits */}
      {activeTab === 'history' && (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="text-green-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Realisasi Visit</h2>
        </div>
        
        <div className="realisasi-table-container bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            columns={realisasiColumns}
            data={realisasiVisits}
            loading={loading}
            emptyMessage="Belum ada realisasi visit"
          />
        </div>
      </div>
      )}

      {/* Visit Form Modal */}
      {rescheduleVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reschedule Visit</h2>
                <p className="text-sm text-gray-500">{rescheduleVisit.customer?.name || 'Customer'}</p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleVisit(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRescheduleVisit} className="space-y-4">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                Gunakan ini kalau customer minta jadwal ulang. Visit tetap berada di pending sampai benar-benar dilakukan atau ditandai terlewat.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={rescheduleForm.tanggal_visit}
                    onChange={(event) => setRescheduleForm(prev => ({ ...prev, tanggal_visit: event.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Baru</label>
                  <input
                    type="time"
                    value={rescheduleForm.waktu_visit}
                    onChange={(event) => setRescheduleForm(prev => ({ ...prev, waktu_visit: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Reschedule</label>
                <textarea
                  value={rescheduleForm.catatan}
                  onChange={(event) => setRescheduleForm(prev => ({ ...prev, catatan: event.target.value }))}
                  rows={3}
                  className="w-full resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Contoh: customer minta diundur karena meeting internal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRescheduleVisit(null)} disabled={submitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal Baru'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit Form Modal */}
      {showVisitForm && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-green-600" size={20} />
              <h2 className="text-lg font-semibold">Realisasi Visit</h2>
            </div>
            
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900">{selectedVisit.customer?.name}</h3>
              <p className="text-sm text-gray-600">{selectedVisit.customer?.company}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedVisit.lokasi}</p>
            </div>

            {/* Location Status */}
            {currentLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-green-800">Lokasi Terverifikasi</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmitVisit} className="space-y-4">
              {/* Visit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Visit <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Tanggal actual visit dilakukan</p>
              </div>

              {/* Meeting Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.meeting_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, meeting_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Detail diskusi, pain points, objections, agreements, next steps... (min 10 karakter)"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meeting_notes.length}/10 karakter minimum
                </p>
              </div>

              {/* Visit Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasil Visit <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visit_outcome"
                      value="closed"
                      checked={formData.visit_outcome === 'closed'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-green-600"
                      required
                    />
                    <div>
                      <p className="font-medium text-gray-900">Closed (Deal)</p>
                      <p className="text-xs text-gray-500">Customer setuju & deal ditutup</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visit_outcome"
                      value="follow_up"
                      checked={formData.visit_outcome === 'follow_up'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Follow-up</p>
                      <p className="text-xs text-gray-500">Masih ada pembahasan lanjut</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visit_outcome"
                      value="not_interested"
                      checked={formData.visit_outcome === 'not_interested'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-red-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Not Interested</p>
                      <p className="text-xs text-gray-500">Customer tidak tertarik</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visit_outcome"
                      value="rescheduled"
                      checked={formData.visit_outcome === 'rescheduled'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-yellow-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Rescheduled</p>
                      <p className="text-xs text-gray-500">Pertemuan dijadwalkan ulang</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Catatan tambahan jika ada..."
                />
              </div>

              {/* Photo Section with Camera */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Bukti Visit <span className="text-red-500">*</span>
                </label>
                
                {!formData.foto_bukti ? (
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors"
                  >
                    <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-700 font-medium">Ambil Foto dengan Kamera</p>
                    <p className="text-sm text-gray-500 mt-1">GPS location akan otomatis terdeteksi</p>
                  </button>
                ) : (
                  <div className="relative">
                    <img 
                      src={formData.foto_bukti} 
                      alt="Foto visit" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, foto_bukti: null }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                    <div className="mt-2 flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Foto berhasil diambil!</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Visit
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="done">Selesai</option>
                  <option value="missed">Terlewat</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={submitting}
                >
                  <CheckCircle size={16} />
                  {submitting ? 'Menyimpan...' : 'Simpan Realisasi'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => {
                    setShowVisitForm(false)
                    setSelectedVisit(null)
                    setCurrentLocation(null)
                    setFormData({
                      visit_date: new Date().toISOString().split('T')[0],
                      meeting_notes: '',
                      visit_outcome: '',
                      deal_amount: '',
                      deal_notes: '',
                      catatan: '',
                      foto_bukti: null,
                      status: 'done'
                    })
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unplanned Visit Form Modal */}
      {showUnplannedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold">Tambah Unplanned Visit</h2>
            </div>

            {/* Location Status - Show GPS Coordinates Only */}
            {currentLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-blue-800">GPS Coordinates</span>
                </div>
                <p className="text-xs text-blue-700 mt-1 font-mono">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}
            
            <form onSubmit={async (e) => {
              e.preventDefault()

              // Guard: prevent double-submit
              if (submitting) return

              if (!currentLocation) {
                toast.error('Lokasi belum terdeteksi')
                return
              }
              
              // Validations
              if (!unplannedFormData.customer_id) {
                toast.error('Pilih customer terlebih dahulu')
                return
              }
              
              if (!unplannedFormData.visit_date) {
                toast.error('Tanggal visit wajib diisi')
                return
              }
              
              if (!unplannedFormData.visit_purpose || unplannedFormData.visit_purpose.length < 10) {
                toast.error('Tujuan visit minimal 10 karakter')
                return
              }
              
              if (!unplannedFormData.meeting_notes || unplannedFormData.meeting_notes.length < 10) {
                toast.error('Meeting notes minimal 10 karakter')
                return
              }
              
              if (!unplannedFormData.visit_outcome) {
                toast.error('Pilih hasil visit')
                return
              }
              
              if (!unplannedFormData.photo) {
                toast.error('Foto bukti visit wajib diambil')
                return
              }
              
              // Validate visit date not in future
              const visitDate = new Date(unplannedFormData.visit_date)
              const today = new Date()
              today.setHours(23, 59, 59, 999)
              if (visitDate > today) {
                toast.error('Tanggal visit tidak boleh di masa depan')
                return
              }
              
              try {
                setSubmitting(true)
                const submitData = {
                  customer_id: parseInt(unplannedFormData.customer_id),
                  visit_date: unplannedFormData.visit_date,
                  visit_time: unplannedFormData.visit_time,
                  visit_purpose: unplannedFormData.visit_purpose,
                  meeting_notes: unplannedFormData.meeting_notes,
                  visit_outcome: unplannedFormData.visit_outcome,
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  photos: [unplannedFormData.photo]
                }
                
                await api.createUnplannedVisit(submitData)
                
                const message = user.role === 'sales' 
                  ? 'Unplanned visit berhasil dibuat dan menunggu approval Sales Manager' 
                  : 'Unplanned visit berhasil dibuat'
                
                toast.success(message)
                
                setShowUnplannedForm(false)
                setCurrentLocation(null)
                setUnplannedFormData({
                  customer_id: '',
                  visit_date: new Date().toISOString().split('T')[0],
                  visit_time: new Date().toTimeString().slice(0, 5),
                  visit_purpose: '',
                  meeting_notes: '',
                  visit_outcome: '',
                  photo: null
                })
                
                fetchData()
                
              } catch (error) {
                toast.error(error.message || 'Gagal menyimpan unplanned visit')
              } finally {
                setSubmitting(false)
              }
            }} className="space-y-4">
              {/* Customer Selection */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 mb-2">Pilih Customer</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={unplannedFormData.customer_id}
                    onChange={(e) => setUnplannedFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.company || 'N/A'} {customer.approval_status === 'pending' ? '(Pending)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Display Selected Customer Info */}
                {unplannedFormData.customer_id && (() => {
                  const selectedCustomer = customers.find(c => c.id === parseInt(unplannedFormData.customer_id))
                  return selectedCustomer ? (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <div className="space-y-1 text-xs">
                        <div className="flex">
                          <span className="w-20 text-gray-600">Nama:</span>
                          <span className="font-medium text-gray-900">{selectedCustomer.name}</span>
                        </div>
                        <div className="flex">
                          <span className="w-20 text-gray-600">Perusahaan:</span>
                          <span className="font-medium text-gray-900">{selectedCustomer.company || '-'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-20 text-gray-600">Telepon:</span>
                          <span className="font-medium text-gray-900">{selectedCustomer.phone || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>

              {/* Visit Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={unplannedFormData.visit_date}
                    onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={unplannedFormData.visit_time}
                    onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Visit Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tujuan Kunjungan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={unplannedFormData.visit_purpose}
                  onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_purpose: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Tujuan kunjungan... (min 10 karakter)"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {unplannedFormData.visit_purpose.length}/10 karakter minimum
                </p>
              </div>

              {/* Meeting Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={unplannedFormData.meeting_notes}
                  onChange={(e) => setUnplannedFormData(prev => ({ ...prev, meeting_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detail diskusi, hasil pertemuan... (min 10 karakter)"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {unplannedFormData.meeting_notes.length}/10 karakter minimum
                </p>
              </div>

              {/* Visit Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasil Visit <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="unplanned_outcome"
                      value="closed"
                      checked={unplannedFormData.visit_outcome === 'closed'}
                      onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-green-600"
                      required
                    />
                    <span className="text-sm font-medium">Closed (Deal)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="unplanned_outcome"
                      value="follow_up"
                      checked={unplannedFormData.visit_outcome === 'follow_up'}
                      onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium">Follow-up</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="unplanned_outcome"
                      value="not_interested"
                      checked={unplannedFormData.visit_outcome === 'not_interested'}
                      onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-red-600"
                    />
                    <span className="text-sm font-medium">Not Interested</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="unplanned_outcome"
                      value="rescheduled"
                      checked={unplannedFormData.visit_outcome === 'rescheduled'}
                      onChange={(e) => setUnplannedFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                      className="text-yellow-600"
                    />
                    <span className="text-sm font-medium">Rescheduled - kunjungan dicatat, perlu jadwal ulang</span>
                  </label>
                </div>
              </div>

              {/* Photo Section with Camera */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Bukti Visit <span className="text-red-500">*</span>
                </label>
                
                {!unplannedFormData.photo ? (
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-700 font-medium">Ambil Foto dengan Kamera</p>
                    <p className="text-sm text-gray-500 mt-1">GPS location akan otomatis terdeteksi</p>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <img 
                      src={unplannedFormData.photo} 
                      alt="Visit photo" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Camera size={16} />
                      Ambil Ulang
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle size={16} />
                  Simpan Unplanned Visit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowUnplannedForm(false)
                    setCurrentLocation(null)
                    setUnplannedFormData({
                      customer_id: '',
                      visit_date: new Date().toISOString().split('T')[0],
                      visit_time: new Date().toTimeString().slice(0, 5),
                      visit_purpose: '',
                      meeting_notes: '',
                      visit_outcome: '',
                      photo: null
                    })
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraAttendance
          onCapture={(captureData) => {
            if (captureData.latitude && captureData.longitude) {
              setCurrentLocation({
                latitude: captureData.latitude,
                longitude: captureData.longitude,
                accuracy: captureData.gps_data?.accuracy,
              })
            }

            // Check if we're in unplanned form or planned form
            if (showUnplannedForm) {
              setUnplannedFormData(prev => ({ ...prev, photo: captureData.photo }))
            } else if (showVisitForm) {
              setFormData(prev => ({ ...prev, foto_bukti: captureData.photo }))
            }
            setShowCamera(false)
            toast.success('Foto berhasil diambil!')
          }}
          onCancel={() => setShowCamera(false)}
          type="visit"
        />
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Foto Bukti Visit</h3>
                <button
                  onClick={() => {
                    setShowPhotoModal(false)
                    setSelectedPhoto(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Visit Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">
                      {selectedPhoto.plan_visit?.customer?.name || 
                       selectedPhoto.directCustomer?.name || 
                       selectedPhoto.customer_name || 
                       '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Waktu Visit</p>
                    <p className="font-medium text-gray-900">
                      {selectedPhoto.visit_date 
                        ? `${new Date(selectedPhoto.visit_date).toLocaleDateString('id-ID')} ${selectedPhoto.visit_time || ''}`
                        : selectedPhoto.visited_at
                          ? new Date(selectedPhoto.visited_at).toLocaleString('id-ID')
                          : selectedPhoto.created_at
                            ? new Date(selectedPhoto.created_at).toLocaleString('id-ID')
                            : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Hasil Visit</p>
                    <p className="font-medium text-gray-900">
                      {selectedPhoto.meeting_notes || 
                       selectedPhoto.visit_purpose || 
                       selectedPhoto.hasil_visit || 
                       selectedPhoto.catatan || 
                       '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">GPS Coordinates</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {selectedPhoto.latitude && selectedPhoto.longitude
                        ? `${parseFloat(selectedPhoto.latitude).toFixed(6)}, ${parseFloat(selectedPhoto.longitude).toFixed(6)}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-4">
                {Array.isArray(selectedPhoto.photos) ? (
                  selectedPhoto.photos.map((photo, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Foto visit ${index + 1}`}
                        className="w-full h-auto"
                      />
                    </div>
                  ))
                ) : selectedPhoto.photos ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={selectedPhoto.photos} 
                      alt="Foto visit"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Tidak ada foto</p>
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => {
                    setShowPhotoModal(false)
                    setSelectedPhoto(null)
                  }}
                  className="w-full"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
