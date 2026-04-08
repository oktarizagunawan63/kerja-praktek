import { useState, useEffect } from 'react'
import { Users, Calendar, CheckSquare, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function SalesManagerDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    total_customers: 0,
    total_plan_visits: 0,
    completed_visits: 0,
    total_sales: 0
  })
  const [recentCustomers, setRecentCustomers] = useState([])
  const [recentVisits, setRecentVisits] = useState([])
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load dashboard stats with fallback
      try {
        const statsResponse = await api.getDashboardStats()
        setStats(statsResponse.data || stats)
      } catch (error) {
        console.warn('Dashboard stats failed, using defaults:', error.message)
        // Keep default stats if API fails
      }
      
      // Load recent customers with fallback
      try {
        const customersResponse = await api.getCustomers({ limit: 3 })
        const customersData = customersResponse.data?.data || customersResponse.data || []
        setRecentCustomers(customersData)
      } catch (error) {
        console.warn('Customers API failed:', error.message)
        setRecentCustomers([])
      }
      
      // Load recent plan visits with fallback
      try {
        const visitsResponse = await api.getPlanVisits({ limit: 3 })
        const visitsData = visitsResponse.data?.data || visitsResponse.data || []
        setRecentVisits(visitsData)
      } catch (error) {
        console.warn('Plan visits API failed:', error.message)
        setRecentVisits([])
      }
      
      // Load recent warnings with fallback
      try {
        const warningsResponse = await api.getWarnings({ limit: 2 })
        const warningsData = warningsResponse.data?.data || warningsResponse.data || []
        setWarnings(warningsData)
      } catch (error) {
        console.warn('Warnings API failed:', error.message)
        setWarnings([])
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Don't show toast error for dashboard loading issues
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Sales Manager Dashboard</h1>
            <p className="text-green-700">Welcome back, {user?.name}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-green-700">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-green-700">{stats.total_customers}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Plan Visits</p>
                  <p className="text-2xl font-bold text-green-700">{stats.total_plan_visits}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Calendar className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed Visits</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completed_visits}</p>
                </div>
                <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
                  <CheckSquare className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Sales</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total_sales}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Customer List */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="text-green-600" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Customers</h2>
                </div>
                <button 
                  onClick={() => window.location.href = '/customers'}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              
              <div className="space-y-4">
                {recentCustomers.length > 0 ? recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Users className="text-white" size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.company || customer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                      <p className="text-xs text-green-600">{customer.address}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No customers yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Plan Visits */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-green-600" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Plan Visits</h2>
                </div>
                <button 
                  onClick={() => window.location.href = '/plan-visits'}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              
              <div className="space-y-4">
                {recentVisits.length > 0 ? recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <MapPin className="text-white" size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{visit.customer?.name || 'Unknown Customer'}</p>
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
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No visits planned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Warnings */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Warnings</h2>
                </div>
                <button 
                  onClick={() => window.location.href = '/warnings'}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              
              <div className="space-y-4">
                {warnings.length > 0 ? warnings.map((warning) => (
                  <div key={warning.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                      <AlertTriangle className="text-white" size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{warning.title}</p>
                      <p className="text-sm text-gray-600 mb-1">{warning.message}</p>
                      <p className="text-xs text-red-600">{warning.user?.name || 'System'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No warnings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Performance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Sales Performance</h2>
                </div>
                <button 
                  onClick={() => window.location.href = '/visit-reports'}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Lihat Detail
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Total Sales Active</span>
                  <span className="font-semibold text-green-700">{stats.total_sales}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Visits This Month</span>
                  <span className="font-semibold text-blue-700">{stats.total_plan_visits}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-gray-700">Completion Rate</span>
                  <span className="font-semibold text-yellow-700">
                    {stats.total_plan_visits > 0 ? Math.round((stats.completed_visits / stats.total_plan_visits) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/customers'}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <Users className="text-green-600" size={24} />
                <span className="text-sm font-medium text-green-700">Manage Customers</span>
              </button>
              <button 
                onClick={() => window.location.href = '/plan-visits'}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <Calendar className="text-green-600" size={24} />
                <span className="text-sm font-medium text-green-700">Plan Visits</span>
              </button>
              <button 
                onClick={() => window.location.href = '/visit-reports'}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <TrendingUp className="text-green-600" size={24} />
                <span className="text-sm font-medium text-green-700">View Reports</span>
              </button>
              <button 
                onClick={() => window.location.href = '/warnings'}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <AlertTriangle className="text-green-600" size={24} />
                <span className="text-sm font-medium text-green-700">Manage Warnings</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}