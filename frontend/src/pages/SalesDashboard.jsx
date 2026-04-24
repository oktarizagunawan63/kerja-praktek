import { useState, useEffect } from 'react'
import { Users, Calendar, CheckSquare, Clock, TrendingUp, MapPin, Target } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function SalesDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    my_customers: 0,
    assigned_visits: 0,
    completed_visits: 0,
    monthly_completion: 0
  })
  const [myVisits, setMyVisits] = useState([])
  const [myCustomers, setMyCustomers] = useState([])
  const [todayAttendance, setTodayAttendance] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch customers (including pending)
      const customersRes = await api.getCustomers()
      const allCustomers = customersRes.data || []
      // Only count approved customers in stats
      const approvedCustomers = allCustomers.filter(c => c.approval_status === 'approved')
      
      // Fetch plan visits
      const visitsRes = await api.getPlanVisits()
      const allVisits = visitsRes.data || []
      
      // Fetch realisasi visits
      const realisasiRes = await api.getRealisasiVisits()
      const completedVisits = realisasiRes.data || []
      
      // Fetch today attendance
      const attendanceRes = await api.getTodayAttendance()
      setTodayAttendance(attendanceRes.data)
      
      // Calculate stats (only approved customers)
      const assignedVisits = allVisits.filter(v => v.assigned_to === user.id)
      const completed = completedVisits.filter(v => v.visited_by === user.id && v.status === 'done')
      const completionRate = assignedVisits.length > 0 
        ? Math.round((completed.length / assignedVisits.length) * 100) 
        : 0
      
      setStats({
        my_customers: approvedCustomers.length, // Only approved
        assigned_visits: assignedVisits.length,
        completed_visits: completed.length,
        monthly_completion: completionRate
      })
      
      // Get upcoming visits (next 5)
      const upcomingVisits = assignedVisits
        .sort((a, b) => new Date(a.tanggal_visit) - new Date(b.tanggal_visit))
        .slice(0, 5)
      
      setMyVisits(upcomingVisits)
      
      // Set all customers (including pending) for display
      setMyCustomers(allCustomers.slice(0, 5))
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  const canCheckIn = !todayAttendance?.check_in_time
  const canCheckOut = todayAttendance?.check_in_time && !todayAttendance?.check_out_time

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
        <div className="bg-red-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">My Customers</p>
              <p className="text-2xl font-bold text-red-700">{stats.my_customers}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Assigned Visits</p>
              <p className="text-2xl font-bold text-red-700">{stats.assigned_visits}</p>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed Visits</p>
              <p className="text-2xl font-bold text-red-700">{stats.completed_visits}</p>
            </div>
            <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
              <CheckSquare className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">This Month Target</p>
              <p className="text-2xl font-bold text-orange-700">{stats.monthly_completion}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Target className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-red-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">My Customers</h2>
          </div>
          
          <div className="space-y-3">
            {myCustomers.length > 0 ? (
              myCustomers.map((customer) => (
                <div key={customer.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.approval_status === 'pending' && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{customer.company || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">{customer.phone}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada customer</p>
            )}
          </div>
        </div>

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
          <button 
            onClick={() => window.location.href = '/customers'}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <Users className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">My Customers</span>
          </button>
          <button 
            onClick={() => window.location.href = '/plan-visits'}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <Calendar className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">My Plan Visits</span>
          </button>
          <button 
            onClick={() => window.location.href = '/realisasi-visits'}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <CheckSquare className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Complete Visit</span>
          </button>
          <button 
            onClick={() => window.location.href = '/attendance'}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <Clock className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Attendance</span>
          </button>
        </div>
      </div>
    </div>
  )
}