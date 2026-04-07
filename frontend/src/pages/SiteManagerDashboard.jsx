import { useState, useEffect } from 'react'
import { Users, Calendar, CheckSquare, AlertTriangle, Clock, TrendingUp, MapPin, Phone } from 'lucide-react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function SiteManagerDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({})
  const [recentVisits, setRecentVisits] = useState([])
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await api.getDashboardStats()
      setStats(statsResponse.data || {})
      
      // Fetch recent visits
      const visitsResponse = await api.getPlanVisits({ limit: 5 })
      setRecentVisits(visitsResponse.data?.data || [])
      
      // Fetch warnings
      const warningsResponse = await api.getWarnings({ limit: 5 })
      setWarnings(warningsResponse.data?.data || [])
      
    } catch (error) {
      toast.error('Gagal memuat data dashboard')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.total_customers || 0,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Plan Visits',
      value: stats.total_plan_visits || 0,
      icon: Calendar,
      color: 'bg-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Completed Visits',
      value: stats.completed_visits || 0,
      icon: CheckSquare,
      color: 'bg-green-700',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Missed Visits',
      value: stats.missed_visits || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
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
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <Users className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Site Manager Dashboard</h1>
            <p className="text-green-700">Welcome back, {user?.name}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-green-100`}>
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
        {/* Recent Plan Visits */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Recent Plan Visits</h2>
          </div>
          
          <div className="space-y-4">
            {recentVisits.length > 0 ? (
              recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <MapPin className="text-white" size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{visit.customer?.name}</p>
                      <p className="text-sm text-gray-600">{visit.lokasi}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">
                      {new Date(visit.tanggal_visit).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">{visit.assigned_to?.name || 'Unassigned'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada plan visit</p>
            )}
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Recent Warnings</h2>
          </div>
          
          <div className="space-y-4">
            {warnings.length > 0 ? (
              warnings.map((warning) => (
                <div key={warning.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-white" size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{warning.title}</p>
                    <p className="text-sm text-gray-600 mb-1">{warning.message}</p>
                    <p className="text-xs text-red-600">{warning.user?.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada warning</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-green-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
            <Users className="text-green-600" size={24} />
            <span className="text-sm font-medium text-green-700">Add Customer</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
            <Calendar className="text-green-600" size={24} />
            <span className="text-sm font-medium text-green-700">Plan Visit</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
            <TrendingUp className="text-green-600" size={24} />
            <span className="text-sm font-medium text-green-700">View Reports</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
            <Clock className="text-green-600" size={24} />
            <span className="text-sm font-medium text-green-700">Attendance</span>
          </button>
        </div>
      </div>
    </div>
  )
}