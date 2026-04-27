import { useState, useEffect } from 'react'
import { Users, Calendar, CheckSquare, Clock, TrendingUp, MapPin, Target, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { request } from '../lib/api'
import toast from 'react-hot-toast'

export default function SalesDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await request('/dashboard/sales', { method: 'GET' })
      
      if (response.success) {
        setDashboardData(response.data)
      } else {
        toast.error('Gagal memuat data dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

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

  if (!dashboardData) {
    return (
      <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Gagal memuat data dashboard</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { stats, my_customers, my_visits, attendance_warning } = dashboardData

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

      {/* Attendance Warning */}
      {attendance_warning && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-600" size={20} />
            <div>
              <p className="font-medium text-yellow-800">Belum Absen Hari Ini</p>
              <p className="text-sm text-yellow-700">Jangan lupa untuk melakukan absensi sebelum memulai visit</p>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Absen Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">My Customers</p>
              <p className="text-3xl font-bold text-red-700">{stats.my_customers}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Assigned Visits</p>
              <p className="text-3xl font-bold text-red-700">{stats.assigned_visits}</p>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed Visits</p>
              <p className="text-3xl font-bold text-red-700">{stats.completed_visits}</p>
            </div>
            <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
              <CheckSquare className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">This Month Target</p>
              <p className="text-3xl font-bold text-orange-700">{stats.monthly_completion}%</p>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="text-red-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">My Customers</h2>
            </div>
            <button
              onClick={() => navigate('/customers')}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {my_customers && my_customers.length > 0 ? (
              my_customers.map((customer) => (
                <div key={customer.id} className="p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                     onClick={() => navigate(`/customers`)}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                  </div>
                  <p className="text-sm text-gray-600">{customer.company || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">{customer.phone}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="text-gray-300 mx-auto mb-2" size={32} />
                <p className="text-gray-500 text-sm">Belum ada customer</p>
                <button
                  onClick={() => navigate('/customers')}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Tambah Customer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* My Assigned Visits */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-red-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">My Assigned Visits</h2>
            </div>
            <button
              onClick={() => navigate('/plan-visits')}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {my_visits && my_visits.length > 0 ? (
              my_visits.map((visit) => (
                <div key={visit.id} className="p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                     onClick={() => navigate('/plan-visits')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-white" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{visit.customer?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600 truncate">{visit.lokasi}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-red-700">
                      {new Date(visit.tanggal_visit).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      visit.status === 'scheduled' || visit.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      visit.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' :
                      visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {visit.status === 'scheduled' || visit.status === 'approved' ? 'Direncanakan' :
                       visit.status === 'ongoing' ? 'Sedang Berjalan' :
                       visit.status === 'completed' ? 'Selesai' :
                       visit.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="text-gray-300 mx-auto mb-2" size={32} />
                <p className="text-gray-500 text-sm">Belum ada visit yang ditugaskan</p>
                <button
                  onClick={() => navigate('/plan-visits')}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Lihat Plan Visit
                </button>
              </div>
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
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Completion Rate</span>
                <span className="font-bold text-red-700">{stats.monthly_completion || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-600 h-3 rounded-full transition-all duration-300"
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
            onClick={() => navigate('/customers')}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <Users className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">My Customers</span>
          </button>
          <button 
            onClick={() => navigate('/plan-visits')}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <Calendar className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Plan Visits</span>
          </button>
          <button 
            onClick={() => navigate('/realisasi-visits')}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <CheckSquare className="text-red-600" size={24} />
            <span className="text-sm font-medium text-red-700">Complete Visit</span>
          </button>
          <button 
            onClick={() => navigate('/attendance')}
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
