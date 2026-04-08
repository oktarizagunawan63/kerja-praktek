import { useState, useEffect } from 'react'
import { MapPin, CheckCircle, XCircle, Clock, Navigation } from 'lucide-react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

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

export default function RealisasiVisitsPage() {
  const { user } = useAuthStore()
  const [pendingVisits, setPendingVisits] = useState([])
  const [realisasiVisits, setRealisasiVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [formData, setFormData] = useState({
    hasil_visit: '',
    catatan: '',
    foto_bukti: null,
    status: 'done'
  })

  useEffect(() => {
    // Check if user has permission to access realisasi visits
    if (!can(user, 'access_visit_management')) {
      return
    }
    
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch pending visits with fallback
      try {
        const pendingResponse = await api.getPendingVisits()
        setPendingVisits(pendingResponse.data || [])
      } catch (error) {
        console.warn('Pending visits API failed:', error.message)
        setPendingVisits([])
      }
      
      // Fetch realisasi visits with fallback
      try {
        const realisasiResponse = await api.getRealisasiVisits()
        const realisasiData = realisasiResponse.data?.data || realisasiResponse.data || []
        setRealisasiVisits(realisasiData)
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

  const handleStartVisit = async (visit) => {
    try {
      setLocationLoading(true)
      toast.loading('Mendapatkan lokasi Anda...', { id: 'location' })
      
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      
      // Validate distance to customer location
      if (visit.customer?.latitude && visit.customer?.longitude) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          parseFloat(visit.customer.latitude),
          parseFloat(visit.customer.longitude)
        )
        
        if (distance > 100) { // 100 meters radius
          toast.error(`Anda terlalu jauh dari lokasi customer (${Math.round(distance)}m). Maksimal 100m.`, { id: 'location' })
          return
        }
        
        toast.success(`Lokasi terverifikasi (${Math.round(distance)}m dari customer)`, { id: 'location' })
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
    
    if (!currentLocation) {
      toast.error('Lokasi belum terdeteksi')
      return
    }
    
    try {
      const submitData = {
        plan_visit_id: selectedVisit.id,
        hasil_visit: formData.hasil_visit,
        catatan: formData.catatan,
        status: formData.status,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        visited_at: new Date().toISOString()
      }
      
      await api.createRealisasiVisit(submitData)
      toast.success('Realisasi visit berhasil disimpan')
      
      setShowVisitForm(false)
      setSelectedVisit(null)
      setCurrentLocation(null)
      setFormData({
        hasil_visit: '',
        catatan: '',
        foto_bukti: null,
        status: 'done'
      })
      
      fetchData()
      
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan realisasi visit')
    }
  }

  const handleMarkAsMissed = async (visit) => {
    if (!window.confirm(`Tandai visit ke ${visit.customer?.name} sebagai terlewat?`)) return
    
    try {
      await api.markVisitAsMissed(visit.id)
      toast.success('Visit ditandai sebagai terlewat')
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal menandai visit sebagai terlewat')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      done: 'bg-green-100 text-green-700',
      missed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700'
    }
    
    const labels = {
      done: 'Selesai',
      missed: 'Terlewat',
      pending: 'Pending'
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[status] || badges.pending}`}>
        {labels[status] || status}
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
      key: 'customer',
      label: 'Customer',
      render: (realisasi) => (
        <div>
          <p className="font-medium text-gray-900">{realisasi.plan_visit?.customer?.name}</p>
          <p className="text-sm text-gray-500">{realisasi.plan_visit?.customer?.company}</p>
        </div>
      )
    },
    {
      key: 'visited_at',
      label: 'Waktu Visit',
      render: (realisasi) => (
        <div>
          <p className="text-sm font-medium">
            {new Date(realisasi.visited_at).toLocaleDateString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(realisasi.visited_at).toLocaleTimeString('id-ID')}
          </p>
        </div>
      )
    },
    {
      key: 'hasil_visit',
      label: 'Hasil Visit',
      render: (realisasi) => (
        <span className="text-sm text-gray-600">{realisasi.hasil_visit}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (realisasi) => getStatusBadge(realisasi.status)
    }
  ]

  // Check permissions first
  if (!can(user, 'access_visit_management')) {
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Realisasi Visit</h1>
        <p className="text-gray-600">Lakukan kunjungan ke customer dengan GPS tracking</p>
      </div>

      {/* Pending Visits */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-orange-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Pending Visits</h2>
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
            {pendingVisits.length}
          </span>
        </div>
        
        <DataTable
          columns={pendingColumns}
          data={pendingVisits}
          loading={loading}
          emptyMessage="Tidak ada visit yang pending"
        />
      </div>

      {/* Completed Visits */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="text-green-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Realisasi Visit</h2>
        </div>
        
        <DataTable
          columns={realisasiColumns}
          data={realisasiVisits}
          loading={loading}
          emptyMessage="Belum ada realisasi visit"
        />
      </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasil Visit
                </label>
                <textarea
                  value={formData.hasil_visit}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasil_visit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Deskripsikan hasil kunjungan..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                />
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
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle size={16} />
                  Simpan Realisasi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVisitForm(false)
                    setSelectedVisit(null)
                    setCurrentLocation(null)
                    setFormData({
                      hasil_visit: '',
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
    </div>
  )
}