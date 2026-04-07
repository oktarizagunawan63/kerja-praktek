import { useState, useEffect } from 'react'
import { Users, Calendar, CheckSquare, Clock, TrendingUp, MapPin, Target } from 'lucide-react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function SalesDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({})
  const [myVisits, setMyVisits] = useState([])
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch my stats (sales-specific)
      const statsResponse = await api.getMySalesStats()
      setStats(statsResponse.data || {})
      
      // Fetch my visits
      const visitsResponse = await api.getPlanVisits({ 
        assigned_to: user.id,
        limit: 5 
      })
      setMyVisits(visitsResponse.data?.data || [])
      
      // Check today's attendance
      const attendanceResponse = await api.getTodayAttendance()
      setTodayAttendance(attendanceResponse.data)
      
    } catch (error) {
      toast.error('Gagal memuat data dashboard')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'My Customers',
      value: stats.my_customers || 0,
      icon: Users,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      title: 'Assigned Visits',
      value: stats.assigned_visits || 0,
      icon: Calendar,
      color: 'bg-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      title: 'Completed Visits',
      value: stats.completed_visits || 0,
      icon: CheckSquare,
      color: 'bg-red-700',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      title: 'This Month Target',
      value: `${stats.monthly_completion || 0}%`,
      icon: Target,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Target className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-red-700">Welcome back, {user?.name}</p>
          </div>
        </div>
      </div>

      {/* Attendance Status */}
      {!todayAttendance && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-600" size={20} />
            <div>
              <p className="font-medium text-yellow-800">Belum Absen Hari Ini</p>
              <p className="text-sm text-yellow-700">Jangan lupa untuk melakukan absensi sebelum memulai visit</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-red-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Assigned Visits */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-red-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">My Assigned Visits</h2>
          </div>
          
          <div className="space-y-4">
            {myVisits.length > 0 ? (
              myVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <MapPin className="text-white" size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{visit.customer?.name}</p>
                      <p className="text-sm text-gray-600">{visit.lokasi}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-700">
                      {new Date(visit.tanggal_visit).toLocaleDateString('id-ID')}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      visit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      visit.status === 'done' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada visit yang ditugaskan</p>
            )}
          </div>
        </div>

        {/* Performance This Month */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-red-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Performance This Month</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Visits</span>
              <span className="font-semibold text-gray-900">{stats.monthly_visits || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{stats.monthly_completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Missed</span>
              <span className="font-semibold text-red-600">{stats.monthly_missed || 0}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-red-700">{stats.monthly_completion || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.monthly_completion || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-red-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors">
            <Users className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Add Customer</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors">
            <Calendar className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Plan Visit</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors">
            <CheckSquare className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Complete Visit</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors">
            <Clock className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Attendance</span>
          </button>
        </div>
      </div>
    </div>
  )
}