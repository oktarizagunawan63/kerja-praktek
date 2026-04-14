import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Clock, Search, Calendar, MapPin, AlertTriangle, Eye } from 'lucide-react'
import { api } from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

// Helper functions
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

const getRoleLabel = (role) => {
  const roleMap = {
    'admin': 'Administrator',
    'sales_manager': 'Sales Manager', 
    'sales': 'Sales',
    'site_manager': 'Site Manager',
    'engineer': 'Engineer'
  }
  return roleMap[role] || role
}

export default function AdminAttendanceMonitorPage() {
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  })
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedDate])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      const response = await api.getAdminAttendanceMonitor({ date: selectedDate })
      
      if (response.success) {
        setAttendanceData(response.data.attendance || [])
        setSummary(response.data.summary || {
          totalEmployees: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0
        })
      } else {
        toast.error('Gagal memuat data attendance')
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast.error('Gagal memuat data attendance')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (attendance) => {
    if (!attendance.check_in_time) {
      return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Tidak Hadir</span>
    }
    
    if (!attendance.check_out_time) {
      return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Sedang Bekerja</span>
    }
    
    return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Selesai</span>
  }

  const getGpsWarningBadge = (attendance) => {
    if (attendance.gps_warning || attendance.gps_warnings?.length > 0) {
      return (
        <div className="flex items-center gap-1">
          <AlertTriangle size={14} className="text-orange-500" />
          <span className="text-xs text-orange-600">GPS Warning</span>
        </div>
      )
    }
    return <span className="text-xs text-gray-500">Normal</span>
  }

  const filteredData = attendanceData.filter(attendance => 
    attendance.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendance.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'photo',
      label: 'Foto',
      render: (attendance) => (
        <div className="flex items-center justify-center">
          {attendance.check_in_photo ? (
            <button
              onClick={() => setSelectedPhoto(getPhotoSrc(attendance.check_in_photo))}
              className="relative group"
            >
              <img 
                src={getPhotoSrc(attendance.check_in_photo)} 
                alt="Foto Check-In"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all">
                <Eye size={12} className="text-white opacity-0 group-hover:opacity-100" />
              </div>
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Users size={16} className="text-gray-400" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'employee',
      label: 'Nama & Role',
      render: (attendance) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{attendance.user_name}</p>
          <p className="text-xs text-gray-500">{getRoleLabel(attendance.user_role)}</p>
        </div>
      )
    },
    {
      key: 'check_in',
      label: 'Check In',
      render: (attendance) => (
        <div className="text-sm">
          {attendance.check_in_time ? (
            <span className="text-green-600 font-medium">{formatTime(attendance.check_in_time)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (attendance) => (
        <div className="text-sm">
          {attendance.check_out_time ? (
            <span className="text-red-600 font-medium">{formatTime(attendance.check_out_time)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
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
      label: 'Lokasi GPS',
      render: (attendance) => (
        <div className="text-xs">
          {attendance.check_in_latitude && attendance.check_in_longitude ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <MapPin size={10} className="text-green-500" />
                <span className="text-gray-600">
                  In: {parseFloat(attendance.check_in_latitude).toFixed(4)}, {parseFloat(attendance.check_in_longitude).toFixed(4)}
                </span>
              </div>
              {attendance.check_out_latitude && attendance.check_out_longitude && (
                <div className="flex items-center gap-1">
                  <MapPin size={10} className="text-red-500" />
                  <span className="text-gray-600">
                    Out: {parseFloat(attendance.check_out_latitude).toFixed(4)}, {parseFloat(attendance.check_out_longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">GPS tidak tersedia</span>
          )}
        </div>
      )
    },
    {
      key: 'gps_warning',
      label: 'GPS Warning',
      render: (attendance) => getGpsWarningBadge(attendance)
    },
    {
      key: 'status',
      label: 'Status',
      render: (attendance) => getStatusBadge(attendance)
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Monitor</h1>
        <p className="text-gray-600">Monitor kehadiran seluruh karyawan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Karyawan</p>
              <p className="text-2xl font-bold text-blue-700">{summary.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Hadir Hari Ini</p>
              <p className="text-2xl font-bold text-green-700">{summary.presentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Tidak Hadir</p>
              <p className="text-2xl font-bold text-red-700">{summary.absentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Terlambat</p>
              <p className="text-2xl font-bold text-orange-700">{summary.lateToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Tanggal
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search size={16} className="inline mr-1" />
              Cari Karyawan
            </label>
            <Input
              type="text"
              placeholder="Nama atau role karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={fetchAttendanceData}
              disabled={loading}
              className="h-10"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Data Kehadiran - {new Date(selectedDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Menampilkan {filteredData.length} dari {attendanceData.length} karyawan
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            loading={loading}
            emptyMessage="Tidak ada data kehadiran untuk tanggal ini"
          />
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-full">
            <img 
              src={selectedPhoto} 
              alt="Foto Check-In"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}