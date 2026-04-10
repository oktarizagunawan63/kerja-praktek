import { useState, useEffect } from 'react'
import { Clock, MapPin, CheckCircle, XCircle, Calendar, Navigation, RotateCcw } from 'lucide-react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

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
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)

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

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end - start
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}j ${minutes}m`
  }

  const getStatusBadge = (attendance) => {
    if (!attendance.check_in_time) {
      return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Tidak Hadir</span>
    }
    
    if (!attendance.check_out_time) {
      return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Sedang Bekerja</span>
    }
    
    return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Selesai</span>
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
          {calculateWorkingHours(attendance.check_in_time, attendance.check_out_time)}
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
                  {attendance.check_in_latitude.toFixed(4)}, {attendance.check_in_longitude.toFixed(4)}
                </span>
                {attendance.check_out_latitude && attendance.check_out_longitude && (
                  <span className="text-xs text-gray-500 block">
                    Out: {attendance.check_out_latitude.toFixed(4)}, {attendance.check_out_longitude.toFixed(4)}
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Kelola kehadiran dengan GPS tracking</p>
      </div>

      {/* Today's Status */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 mb-8 border border-red-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Kehadiran Hari Ini</h2>
            <p className="text-red-700 font-medium">{today}</p>
            
            {todayAttendance ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm">
                      Check In: <span className="font-medium">{formatTime(todayAttendance.check_in_time)}</span>
                    </span>
                  </div>
                  
                  {todayAttendance.check_out_time && (
                    <div className="flex items-center gap-2">
                      <XCircle className="text-red-500" size={16} />
                      <span className="text-sm">
                        Check Out: <span className="font-medium">{formatTime(todayAttendance.check_out_time)}</span>
                      </span>
                    </div>
                  )}
                </div>
                
                {todayAttendance.check_in_time && todayAttendance.check_out_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-blue-500" size={16} />
                    <span className="text-sm">
                      Total Jam Visit: <span className="font-medium">
                        {calculateWorkingHours(todayAttendance.check_in_time, todayAttendance.check_out_time)}
                      </span>
                    </span>
                  </div>
                )}
                
                {/* Show GPS coordinates */}
                {todayAttendance.check_in_latitude && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>
                      GPS: {todayAttendance.check_in_latitude.toFixed(6)}, {todayAttendance.check_in_longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mt-2">Belum melakukan check-in hari ini</p>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            {canCheckIn && (
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Navigation size={16} />
                Check In
              </Button>
            )}
            
            {canCheckOut && (
              <Button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <Navigation size={16} />
                Check Out
              </Button>
            )}
            
            {!canCheckIn && !canCheckOut && isCompleted && (
              <div className="text-center">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
                <p className="text-sm text-green-700 font-medium">Attendance Complete</p>
                {(user?.role === 'administrator' || user?.role === 'direktur') && (
                  <Button
                    onClick={handleResetAttendance}
                    disabled={actionLoading}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 mt-2"
                  >
                    <RotateCcw size={14} />
                    Reset Attendance
                  </Button>
                )}
              </div>
            )}
            
            {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
              <div className="text-center">
                <Clock className="text-yellow-500 mx-auto mb-2" size={24} />
                <p className="text-sm text-yellow-700 font-medium">Sedang Bekerja</p>
                <p className="text-xs text-gray-500">Jangan lupa check-out</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Location Display */}
      {(currentLocation || todayAttendance?.check_in_latitude) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-blue-800">
              {currentLocation ? 'Lokasi Saat Ini' : 'Lokasi Check-in Hari Ini'}
            </span>
          </div>
          
          {currentLocation && (
            <>
              <p className="text-xs text-blue-700 mb-1">
                GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-blue-600">
                Akurasi: ±{Math.round(currentLocation.accuracy)}m
              </p>
            </>
          )}
          
          {todayAttendance?.check_in_latitude && !currentLocation && (
            <>
              <p className="text-xs text-blue-700 mb-1">
                Check-in: {todayAttendance.check_in_latitude.toFixed(6)}, {todayAttendance.check_in_longitude.toFixed(6)}
              </p>
              {todayAttendance.check_out_latitude && (
                <p className="text-xs text-blue-700">
                  Check-out: {todayAttendance.check_out_latitude.toFixed(6)}, {todayAttendance.check_out_longitude.toFixed(6)}
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
        
        <DataTable
          columns={columns}
          data={attendanceHistory}
          loading={loading}
          emptyMessage="Belum ada riwayat kehadiran"
        />
      </div>
    </div>
  )
}