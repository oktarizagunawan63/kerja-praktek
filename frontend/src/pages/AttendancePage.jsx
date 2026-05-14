import { useState, useEffect } from 'react'
import { Clock, MapPin, CheckCircle, XCircle, Calendar, User, Trash2 } from '@icons'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import { isAdministrator } from '../utils/roleUtils'
import DataTable from '../components/ui/DataTable'
import CameraAttendance from '../components/ui/CameraAttendance'
import toast from 'react-hot-toast'
import '../styles/responsive-global.css'

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
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

function AttendancePage() {
  const { user } = useAuthStore()
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [attendanceType, setAttendanceType] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [workLocations, setWorkLocations] = useState([])

  useEffect(() => {
    fetchData()
    fetchTodayAttendance()
    fetchWorkLocations()
    
    // Get current location - silent error handling
    getCurrentLocation()
      .then(setCurrentLocation)
      .catch(() => {}) // Silent catch - user will be prompted when needed
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.getAttendance()
      if (response.success) {
        setAttendanceHistory(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Gagal memuat data attendance')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const response = await api.getTodayAttendance()
      if (response.success) {
        setTodayAttendance(response.data)
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error)
    }
  }

  const fetchWorkLocations = async () => {
    try {
      const response = await api.getLocations()
      if (response.success) {
        setWorkLocations(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching work locations:', error)
    }
  }

  const handleCheckIn = async () => {
    if (user?.role === 'sales_manager' || user?.role === 'sales') {
      setAttendanceType('checkin')
      setShowCameraModal(true)
    }
  }

  const handleCheckOut = async () => {
    if (user?.role === 'sales_manager' || user?.role === 'sales') {
      setAttendanceType('checkout')
      setShowCameraModal(true)
    }
  }

  const handleCameraAttendance = async (attendanceData) => {
    try {
      setActionLoading(true)
      
      let response
      if (attendanceType === 'checkin') {
        response = await api.checkIn(attendanceData)
      } else {
        response = await api.checkOut(attendanceData)
      }
      
      if (response.success) {
        toast.success(response.message || `${attendanceType === 'checkin' ? 'Check-in' : 'Check-out'} berhasil!`)
        setShowCameraModal(false)
        setAttendanceType(null)
        fetchData()
        fetchTodayAttendance()
      } else {
        toast.error(response.message || `Gagal ${attendanceType === 'checkin' ? 'check-in' : 'check-out'}`)
      }
    } catch (error) {
      toast.error(error.message || `Gagal ${attendanceType === 'checkin' ? 'check-in' : 'check-out'}`)
    } finally {
      setActionLoading(false)
    }
  }



  const handleDeleteAttendance = async (attendance) => {
    const confirmMessage = `Hapus attendance ${attendance.user?.name || 'user'} pada ${new Date(attendance.date).toLocaleDateString('id-ID')}?`
    
    if (!window.confirm(confirmMessage)) return
    
    try {
      setActionLoading(true)
      const response = await api.deleteAttendance(attendance.id)
      
      if (response.success) {
        toast.success('Attendance berhasil dihapus')
        fetchData()
        
        if (attendance.user_id === user.id && attendance.date === new Date().toISOString().split('T')[0]) {
          setTodayAttendance(null)
        }
      } else {
        toast.error(response.message || 'Gagal menghapus attendance')
      }
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus attendance')
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
                  {`${parseFloat(attendance.check_in_latitude).toFixed(4)}, ${parseFloat(attendance.check_in_longitude).toFixed(4)}`}
                </span>
                {attendance.check_out_latitude && attendance.check_out_longitude && (
                  <span className="text-xs text-gray-500 block">
                    Out: {parseFloat(attendance.check_out_latitude).toFixed(4)}, {parseFloat(attendance.check_out_longitude).toFixed(4)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-red-400">GPS tidak tersedia</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (attendance) => getStatusBadge(attendance)
    },
    // Actions column - only for sales_manager and administrator
    ...(user?.role === 'sales_manager' || isAdministrator(user) ? [{
      key: 'actions',
      label: 'Aksi',
      render: (attendance) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDeleteAttendance(attendance)}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
            title="Hapus attendance"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }] : [])
  ]

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const canCheckIn = !todayAttendance?.check_in_time
  const canCheckOut = todayAttendance?.check_in_time && !todayAttendance?.check_out_time

  // Don't render anything for non-sales users - they should be redirected
  const salesRoles = ['sales_manager', 'sales']
  if (!salesRoles.includes(user?.role) && user?.role) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Halaman ini hanya untuk sales team.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola kehadiran dengan GPS tracking</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{today}</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Check In</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {todayAttendance?.check_in_time ? formatTime(todayAttendance.check_in_time) : '-'}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <CheckCircle size={20} className="text-[#237043]" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Check Out</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {todayAttendance?.check_out_time ? formatTime(todayAttendance.check_out_time) : '-'}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <XCircle size={20} className="text-[#237043]" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Jam Kerja</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {calculateDuration(todayAttendance?.check_in_time, todayAttendance?.check_out_time)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Clock size={20} className="text-[#237043]" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-5">
        <div className="form-row-responsive sm-2 md-3">
          {['sales_manager', 'sales'].includes(user?.role) && canCheckIn && (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#237043] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a9844] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle size={16} />
              Check In
            </button>
          )}
          
          {['sales_manager', 'sales'].includes(user?.role) && canCheckOut && (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle size={16} />
              Check Out
            </button>
          )}
        </div>
      </div>

      {/* Current Location Display */}
      {(currentLocation || todayAttendance?.check_in_latitude) && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-[#237043]" size={16} />
            <span className="text-sm font-semibold text-slate-900">
              {currentLocation ? 'Lokasi Saat Ini' : 'Lokasi Check-in Hari Ini'}
            </span>
          </div>
          
          {currentLocation && (
            <p className="font-mono text-xs text-slate-600">
              GPS: {parseFloat(currentLocation.latitude).toFixed(6)}, {parseFloat(currentLocation.longitude).toFixed(6)}
            </p>
          )}
          
          {todayAttendance?.check_in_latitude && !currentLocation && (
            <>
              <p className="font-mono text-xs text-slate-600">
                Check-in: {parseFloat(todayAttendance.check_in_latitude).toFixed(6)}, {parseFloat(todayAttendance.check_in_longitude).toFixed(6)}
              </p>
              {todayAttendance.check_out_latitude && (
                <p className="font-mono text-xs text-slate-600">
                  Check-out: {parseFloat(todayAttendance.check_out_latitude).toFixed(6)}, {parseFloat(todayAttendance.check_out_longitude).toFixed(6)}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Attendance History */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Calendar size={20} />
          Riwayat Kehadiran
        </h2>
        <div className="table-responsive">
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

      {/* Loading Overlay */}
      {actionLoading && (
        <div className="loading-responsive">
          <div className="loading-spinner-responsive"></div>
        </div>
      )}
    </div>
  )
}

export default AttendancePage

