import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Users, Calendar, MapPin, RefreshCw, RotateCcw } from 'lucide-react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

export default function AttendanceMonitorPage() {
  const { user } = useAuthStore()
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Only administrators can access this page
    if (user?.role !== 'administrator' && user?.role !== 'direktur') {
      return
    }
    
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true) // Silent refresh
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)
      
      // Fetch attendance summary
      const summaryResponse = await api.getAttendanceSummary()
      if (summaryResponse.success) {
        setAttendanceSummary(summaryResponse.data)
      }
      
      // Fetch all users to show who hasn't checked in
      const usersResponse = await api.getUsers()
      if (usersResponse.success) {
        const userData = usersResponse.data?.data || usersResponse.data || []
        setAllUsers(Array.isArray(userData) ? userData : [])
      }
      
    } catch (error) {
      if (!silent) {
        console.error('Error fetching attendance data:', error)
        toast.error('Gagal memuat data attendance')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchData()
    toast.success('Data attendance diperbarui')
  }

  const handleResetAttendance = async (userId, userName) => {
    try {
      const today = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
      
      const response = await api.resetAttendance({
        user_id: userId,
        date: today
      })
      
      if (response.success) {
        toast.success(`Attendance ${userName} berhasil direset`)
        fetchData() // Refresh data
      } else {
        toast.error(response.message || 'Gagal reset attendance')
      }
    } catch (error) {
      toast.error(error.message || 'Gagal reset attendance')
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

  const getAttendanceStatus = (userId) => {
    if (!attendanceSummary?.today_attendance) return 'not_checked_in'
    
    const todayAttendance = attendanceSummary.today_attendance.find(a => a.user_id === userId)
    
    if (!todayAttendance || !todayAttendance.check_in_time) {
      return 'not_checked_in'
    }
    
    if (todayAttendance.check_out_time) {
      return 'completed'
    }
    
    return 'working'
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'not_checked_in':
        return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Belum Absen</span>
      case 'working':
        return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Sedang Kerja</span>
      case 'completed':
        return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Selesai</span>
      default:
        return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">-</span>
    }
  }

  const getUserAttendanceData = (userId) => {
    if (!attendanceSummary?.today_attendance) return null
    return attendanceSummary.today_attendance.find(a => a.user_id === userId)
  }

  // Prepare data for DataTable
  const employeeAttendanceData = allUsers.map(employee => {
    const status = getAttendanceStatus(employee.id)
    const attendanceData = getUserAttendanceData(employee.id)
    
    return {
      ...employee,
      attendance_status: status,
      attendance_data: attendanceData,
      check_in_time: attendanceData?.check_in_time,
      check_out_time: attendanceData?.check_out_time,
      working_hours: calculateWorkingHours(attendanceData?.check_in_time, attendanceData?.check_out_time)
    }
  })

  const columns = [
    {
      key: 'name',
      label: 'Nama Karyawan',
      render: (employee) => (
        <div>
          <p className="font-medium text-gray-900">{employee.name}</p>
          <p className="text-xs text-gray-500">{employee.role}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status Kehadiran',
      render: (employee) => getStatusBadge(employee.attendance_status)
    },
    {
      key: 'check_in',
      label: 'Check In',
      render: (employee) => (
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-sm">{formatTime(employee.check_in_time)}</span>
        </div>
      )
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (employee) => (
        <div className="flex items-center gap-1">
          <XCircle size={14} className="text-red-500" />
          <span className="text-sm">{formatTime(employee.check_out_time)}</span>
        </div>
      )
    },
    {
      key: 'working_hours',
      label: 'Jam Kerja',
      render: (employee) => (
        <span className="text-sm font-medium text-gray-900">
          {employee.working_hours}
        </span>
      )
    },
    {
      key: 'location',
      label: 'Lokasi',
      render: (employee) => (
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-gray-400" />
          <div>
            {employee.attendance_data?.check_in_latitude ? (
              <span className="text-xs text-gray-600">
                {employee.attendance_data.check_in_latitude.toFixed(4)}, {employee.attendance_data.check_in_longitude.toFixed(4)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (employee) => (
        <div className="flex items-center gap-2">
          {employee.attendance_data && (
            <Button
              onClick={() => handleResetAttendance(employee.id, employee.name)}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
            >
              <RotateCcw size={12} />
              Reset
            </Button>
          )}
        </div>
      )
    }
  ]

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (user?.role !== 'administrator' && user?.role !== 'direktur') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600">Halaman ini hanya dapat diakses oleh Administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Monitor</h1>
          <p className="text-gray-600">Monitor kehadiran karyawan secara real-time</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </Button>
      </div>

      {/* Today's Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Ringkasan Kehadiran</h2>
            <p className="text-blue-700 font-medium">{today}</p>
          </div>
          
          {attendanceSummary && (
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-gray-600">Sudah Absen</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {attendanceSummary.today_stats.checked_in}
                </p>
                <p className="text-xs text-gray-500">
                  dari {attendanceSummary.today_stats.total_employees} karyawan
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="text-yellow-600" size={20} />
                  <span className="text-sm font-medium text-gray-600">Sedang Kerja</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">
                  {attendanceSummary.today_stats.currently_working}
                </p>
                <p className="text-xs text-gray-500">karyawan aktif</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="text-red-600" size={20} />
                  <span className="text-sm font-medium text-gray-600">Belum Absen</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {attendanceSummary.today_stats.total_employees - attendanceSummary.today_stats.checked_in}
                </p>
                <p className="text-xs text-gray-500">
                  {100 - attendanceSummary.today_stats.attendance_rate}% belum hadir
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Attendance Rate Progress */}
        {attendanceSummary && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Tingkat Kehadiran Hari Ini</span>
              <span>{attendanceSummary.today_stats.attendance_rate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${attendanceSummary.today_stats.attendance_rate}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Attendance Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-gray-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Detail Kehadiran Karyawan</h2>
          {refreshing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw size={14} className="animate-spin" />
              <span>Memperbarui data...</span>
            </div>
          )}
        </div>
        
        <DataTable
          columns={columns}
          data={employeeAttendanceData}
          loading={loading}
          emptyMessage="Belum ada data karyawan"
        />
      </div>

      {/* Recent Activities */}
      {attendanceSummary?.latest_activities && attendanceSummary.latest_activities.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {attendanceSummary.latest_activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.check_out_time ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {activity.check_out_time ? (
                      <XCircle className="text-red-600" size={18} />
                    ) : (
                      <CheckCircle className="text-green-600" size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user_name} • {activity.check_out_time ? 'Check Out' : 'Check In'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.check_out_time || activity.check_in_time).toLocaleTimeString('id-ID')} • {new Date(activity.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}