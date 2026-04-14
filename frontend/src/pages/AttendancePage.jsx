import { useState, useEffect } from 'react'
import { Clock, MapPin, CheckCircle, XCircle, Calendar, Navigation, RotateCcw, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import { isAdministrator } from '../utils/roleUtils'
import DataTable from '../components/ui/DataTable'
import CameraAttendance from '../components/ui/CameraAttendance'
import toast from 'react-hot-toast'

// Helper functions for date/time formatting
const formatTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const calculateDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '-'
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-'
  const diffMs = end - start
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}j ${minutes}m`
}

const getPhotoSrc = (photo) => {
  if (!photo) return null
  if (photo.startsWith('data:image')) return photo
  if (photo.startsWith('http')) return photo
  return `http://127.0.0.1:8000/storage/${photo}`
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

export default function AttendancePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [attendanceType, setAttendanceType] = useState(null)

  // Redirect non-sales users appropriately
  useEffect(() => {
    if (!user?.role) return
    
    const adminRoles = ['admin', 'administrator', 'direktur', 'director']
    const salesRoles = ['sales_manager', 'sales']
    
    if (adminRoles.includes(user.role) || isAdministrator(user)) {
      console.log('Admin user detected, redirecting to attendance monitor:', user?.role)
      navigate('/admin/attendance-monitor', { replace: true })
      return
    }
    
    if (!salesRoles.includes(user.role)) {
      console.log('Non-sales user detected, redirecting to dashboard:', user?.role)
      navigate('/dashboard', { replace: true })
      return
    }
  }, [user, navigate])

  // Legacy admin redirect (backup)
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/attendance-monitor')
      return
    }
  }, [user, navigate])
  
  // Work locations for sales team (in real app, this would come from API)
  const workLocations = [
    {
      id: 1,
      name: 'Kantor Pusat PT Amsar',
      lat: -6.2088,
      lng: 106.8456,
      radius: 100 // meters
    },
    {
      id: 2,
      name: 'Site Proyek RS Cina',
      lat: -6.1751,
      lng: 106.8650,
      radius: 50
    },
    {
      id: 3,
      name: 'Customer Visit Area',
      lat: -6.2297,
      lng: 106.8175,
      radius: 200
    }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch today's attendance with fallback
      try {
        const todayResponse = await api.getTodayAttendance()
        setTodayAttendance(todayResponse.data)
      } catch (error) {
        console.warn('Today attendance API failed:', error.message)
        setTodayAttendance(null)
      }
      
      // Fetch attendance history with fallback
      try {
        const historyResponse = await api.getAttendance()
        const historyData = historyResponse.data?.data || historyResponse.data || []
        setAttendanceHistory(Array.isArray(historyData) ? historyData : [])
      } catch (error) {
        console.warn('Attendance history API failed:', error.message)
        setAttendanceHistory([])
      }
      
    } catch (error) {
      console.error('Error fetching attendance:', error)
      // Don't show toast error for attendance loading issues
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    // For Sales Manager and Sales, use camera attendance with location validation
    if (user?.role === 'sales_manager' || user?.role === 'sales') {
      setAttendanceType('check-in')
      setShowCameraModal(true)
      return
    }
    
    // For other roles, use regular GPS attendance
    try {
      setActionLoading(true)
      toast.loading('Mendapatkan lokasi...', { id: 'attendance' })
      
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      
      const checkInData = {
        latitude: location.latitude,
        longitude: location.longitude,
        check_in_time: new Date().toISOString()
      }
      
      const response = await api.checkIn(checkInData)
      
      if (response.success) {
        toast.success(response.message || 'Check-in berhasil!', { id: 'attendance' })
        
        // Update today's attendance immediately
        setTodayAttendance(response.data)
        
        // Refresh all data
        fetchData()
      } else {
        toast.error(response.message || 'Gagal check-in', { id: 'attendance' })
      }
      
    } catch (error) {
      toast.error(error.message || 'Gagal check-in', { id: 'attendance' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    // For Sales Manager and Sales, use camera attendance with location validation
    if (user?.role === 'sales_manager' || user?.role === 'sales') {
      setAttendanceType('check-out')
      setShowCameraModal(true)
      return
    }
    
    // For other roles, use regular GPS attendance
    try {
      setActionLoading(true)
      toast.loading('Mendapatkan lokasi...', { id: 'attendance' })
      
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      
      const checkOutData = {
        latitude: location.latitude,
        longitude: location.longitude,
        check_out_time: new Date().toISOString()
      }
      
      const response = await api.checkOut(checkOutData)
      
      if (response.success) {
        toast.success(response.message || 'Check-out berhasil!', { id: 'attendance' })
        
        // Update today's attendance immediately
        setTodayAttendance(response.data)
        
        // Refresh all data
        fetchData()
      } else {
        toast.error(response.message || 'Gagal check-out', { id: 'attendance' })
      }
      
    } catch (error) {
      toast.error(error.message || 'Gagal check-out', { id: 'attendance' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCameraAttendance = async (attendanceData) => {
    try {
      setActionLoading(true)
      setShowCameraModal(false)
      
      toast.loading('Memproses attendance...', { id: 'attendance' })
      
      // Handle new data format from fixed camera component
      const submitData = {
        latitude: attendanceData.latitude || 0, // Allow null GPS
        longitude: attendanceData.longitude || 0,
        photo: attendanceData.photo,
        gps_data: attendanceData.gps_data,
        gps_warnings: attendanceData.gps_warnings || [],
        device_info: attendanceData.device_info,
        status: attendanceData.status, // New: pass status from frontend
        gps_warning: attendanceData.gps_warning, // New: pass GPS warning flag
        [attendanceType === 'check-in' ? 'check_in_time' : 'check_out_time']: attendanceData.timestamp
      }
      
      const response = attendanceType === 'check-in' 
        ? await api.checkIn(submitData)
        : await api.checkOut(submitData)
      
      if (response.success) {
        toast.success(response.message || `${attendanceType === 'check-in' ? 'Check-in' : 'Check-out'} berhasil!`, { id: 'attendance' })
        
        // Update today's attendance immediately
        setTodayAttendance(response.data)
        
        // Refresh all data
        fetchData()
      } else {
        toast.error(response.message || `Gagal ${attendanceType}`, { id: 'attendance' })
      }
      
    } catch (error) {
      toast.error(error.message || `Gagal ${attendanceType}`, { id: 'attendance' })
    } finally {
      setActionLoading(false)
      setAttendanceType(null)
    }
  }

  const handleResetAttendance = async () => {
    try {
      setActionLoading(true)
      const today = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
      
      const response = await api.resetAttendance({
        user_id: user.id,
        date: today
      })
      
      if (response.success) {
        toast.success('Attendance berhasil direset')
        setTodayAttendance(null) // Clear today's attendance
        fetchData() // Refresh data
      } else {
        toast.error(response.message || 'Gagal reset attendance')
      }
    } catch (error) {
      toast.error(error.message || 'Gagal reset attendance')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (attendance) => {
    if (!attendance.check_in_time) {
      return <span className="status-badge cancelled">Tidak Hadir</span>
    }
    
    if (!attendance.check_out_time) {
      return <span className="status-badge warning">Sedang Bekerja</span>
    }
    
    return <span className="status-badge success">Selesai</span>
  }

  const columns = [
    {
      key: 'date',
      label: 'Tanggal',
      render: (attendance) => (
        <div>
          <p className="font-medium text-gray-900">
            {new Date(attendance.date).toLocaleDateString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(attendance.date).toLocaleDateString('id-ID', { weekday: 'long' })}
          </p>
        </div>
      )
    },
    {
      key: 'photo',
      label: 'Foto',
      render: (attendance) => (
        <div className="flex items-center justify-center">
          {attendance.check_in_photo ? (
            <img 
              src={getPhotoSrc(attendance.check_in_photo)} 
              alt="Foto Check-In"
              onError={(e) => e.target.src = '/placeholder-avatar.png'}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User size={16} className="text-gray-400" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'check_in',
      label: 'Check In',
      render: (attendance) => (
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-sm">{formatTime(attendance.check_in_time)}</span>
        </div>
      )
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (attendance) => (
        <div className="flex items-center gap-1">
          <XCircle size={14} className="text-red-500" />
          <span className="text-sm">{formatTime(attendance.check_out_time)}</span>
        </div>
      )
    },
    {
      key: 'working_hours',
      label: 'Jam Kerja',
      render: (attendance) => (
        <span className="text-sm font-medium text-gray-900">
          {calculateDuration(attendance.check_in_time, attendance.check_out_time)}
        </span>
      )
    },
    {
      key: 'location',
      label: 'Lokasi Check-in',
      render: (attendance) => (
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-gray-400" />
          <div>
            {attendance.check_in_latitude && attendance.check_in_longitude ? (
              <>
                <span className="text-xs text-gray-600 block">
                  {attendance.check_in_latitude && attendance.check_in_longitude ? 
                    `${parseFloat(attendance.check_in_latitude).toFixed(4)}, ${parseFloat(attendance.check_in_longitude).toFixed(4)}` : 
                    'GPS tidak tersedia'
                  }
                </span>
                {attendance.check_out_latitude && attendance.check_out_longitude && (
                  <span className="text-xs text-gray-500 block">
                    Out: {parseFloat(attendance.check_out_latitude).toFixed(4)}, {parseFloat(attendance.check_out_longitude).toFixed(4)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (attendance) => getStatusBadge(attendance)
    }
  ]

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const canCheckIn = !todayAttendance?.check_in_time
  const canCheckOut = todayAttendance?.check_in_time && !todayAttendance?.check_out_time
  const isCompleted = todayAttendance?.check_in_time && todayAttendance?.check_out_time

  // Don't render anything for non-sales users - they should be redirected
  const salesRoles = ['sales_manager', 'sales']
  if (!salesRoles.includes(user?.role) && user?.role) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">
            {isAdministrator(user) 
              ? 'Redirecting to attendance monitor...' 
              : 'Redirecting to dashboard...'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Kelola kehadiran dengan GPS tracking</p>
      </div>

      {/* Today's Status */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${
        todayAttendance?.check_in_time ? 'attendance-today-card checked-in' : 'attendance-today-card'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Kehadiran Hari Ini</h2>
            <p className="text-gray-700 font-medium mb-4">{today}</p>
            
            {todayAttendance ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check In</p>
                      <p className="font-bold text-green-700">{formatTime(todayAttendance.check_in_time)}</p>
                    </div>
                  </div>
                  
                  {todayAttendance.check_out_time && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Check Out</p>
                        <p className="font-bold text-red-700">{formatTime(todayAttendance.check_out_time)}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {todayAttendance.check_in_time && todayAttendance.check_out_time && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Jam Kerja</p>
                      <p className="font-bold text-blue-700">
                        {calculateDuration(todayAttendance.check_in_time, todayAttendance.check_out_time)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Check-in Photo */}
                {todayAttendance?.check_in_photo && (
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Foto Check-In:</p>
                      <img 
                        src={getPhotoSrc(todayAttendance.check_in_photo)} 
                        alt="Foto Check-In"
                        className="attendance-photo-frame"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-600 font-medium">
                  {['sales_manager', 'sales'].includes(user?.role)
                    ? 'Belum melakukan check-in hari ini' 
                    : 'Halaman ini hanya untuk sales team'
                  }
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            {['sales_manager', 'sales'].includes(user?.role) && canCheckIn && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="btn-professional btn-primary w-full lg:w-auto"
              >
                <Navigation size={16} />
                Check In
              </button>
            )}
            
            {['sales_manager', 'sales'].includes(user?.role) && canCheckOut && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="btn-professional btn-danger w-full lg:w-auto"
              >
                <Navigation size={16} />
                Check Out
              </button>
            )}
            
            {!canCheckIn && !canCheckOut && isCompleted && (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <p className="text-sm text-green-700 font-medium mb-3">Attendance Complete</p>
                {(user?.role === 'administrator' || user?.role === 'direktur') && (
                  <button
                    onClick={handleResetAttendance}
                    disabled={actionLoading}
                    className="btn-professional btn-danger text-sm"
                  >
                    <RotateCcw size={14} />
                    Reset Attendance
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Location Display */}
      {(currentLocation || todayAttendance?.check_in_latitude) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-blue-800">
              {currentLocation ? 'Lokasi Saat Ini' : 'Lokasi Check-in Hari Ini'}
            </span>
          </div>
          
          {currentLocation && (
            <>
              <p className="text-xs text-blue-700 mb-1 break-all">
                GPS: {parseFloat(currentLocation.latitude).toFixed(6)}, {parseFloat(currentLocation.longitude).toFixed(6)}
              </p>
              <p className="text-xs text-blue-600">
                Akurasi: ±{Math.round(currentLocation.accuracy)}m
              </p>
            </>
          )}
          
          {todayAttendance?.check_in_latitude && !currentLocation && (
            <>
              <p className="text-xs text-blue-700 mb-1 break-all">
                Check-in: {parseFloat(todayAttendance.check_in_latitude).toFixed(6)}, {parseFloat(todayAttendance.check_in_longitude).toFixed(6)}
              </p>
              {todayAttendance.check_out_latitude && (
                <p className="text-xs text-blue-700 break-all">
                  Check-out: {parseFloat(todayAttendance.check_out_latitude).toFixed(6)}, {parseFloat(todayAttendance.check_out_longitude).toFixed(6)}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Attendance History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-gray-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Kehadiran</h2>
        </div>
        
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={attendanceHistory}
            loading={loading}
            emptyMessage="Belum ada riwayat kehadiran"
          />
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <CameraAttendance
          type={attendanceType}
          onCapture={handleCameraAttendance}
          onCancel={() => {
            setShowCameraModal(false)
            setAttendanceType(null)
          }}
          workLocations={workLocations}
        />
      )}
    </div>
  )
}