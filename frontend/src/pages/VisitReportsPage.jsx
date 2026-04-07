import { useState, useEffect } from 'react'
import { BarChart3, Calendar, Users, TrendingUp, Download, Filter } from 'lucide-react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

export default function VisitReportsPage() {
  const { user } = useAuthStore()
  const [reportData, setReportData] = useState(null)
  const [salesPerformance, setSalesPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    period: 'monthly',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    sales_id: ''
  })
  const [salesUsers, setSalesUsers] = useState([])

  useEffect(() => {
    fetchData()
    if (can(user, 'view_sales_performance')) {
      fetchSalesUsers()
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchSalesUsers = async () => {
    try {
      const response = await api.getSalesUsers()
      setSalesUsers(response.data || [])
    } catch (error) {
      console.error('Error fetching sales users:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch visit report
      const reportResponse = await api.getVisitReport(filters)
      setReportData(reportResponse.data)
      
      // Fetch sales performance (Site Manager only)
      if (can(user, 'view_sales_performance')) {
        const performanceResponse = await api.getSalesPerformance({
          start_date: filters.start_date,
          end_date: filters.end_date
        })
        setSalesPerformance(performanceResponse.data || [])
      }
      
    } catch (error) {
      toast.error('Gagal memuat data laporan')
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const periodColumns = [
    {
      key: 'period',
      label: 'Periode',
      render: (item) => (
        <span className="font-medium text-gray-900">{item.period}</span>
      )
    },
    {
      key: 'total_visits',
      label: 'Total Visit',
      render: (item) => (
        <span className="text-gray-900">{item.total_visits}</span>
      )
    },
    {
      key: 'completed_visits',
      label: 'Selesai',
      render: (item) => (
        <span className="text-green-600 font-medium">{item.completed_visits}</span>
      )
    },
    {
      key: 'missed_visits',
      label: 'Terlewat',
      render: (item) => (
        <span className="text-red-600 font-medium">{item.missed_visits}</span>
      )
    },
    {
      key: 'pending_visits',
      label: 'Pending',
      render: (item) => (
        <span className="text-yellow-600 font-medium">{item.pending_visits}</span>
      )
    },
    {
      key: 'completion_rate',
      label: 'Completion Rate',
      render: (item) => {
        const rate = item.total_visits > 0 ? 
          Math.round((item.completed_visits / item.total_visits) * 100) : 0
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(rate)}`}>
            {rate}%
          </span>
        )
      }
    }
  ]

  const salesColumns = [
    {
      key: 'sales',
      label: 'Sales',
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.sales.name}</p>
          <p className="text-sm text-gray-500">{item.sales.email}</p>
        </div>
      )
    },
    {
      key: 'total_visits',
      label: 'Total Visit',
      render: (item) => (
        <span className="text-gray-900">{item.total_visits}</span>
      )
    },
    {
      key: 'completed_visits',
      label: 'Selesai',
      render: (item) => (
        <span className="text-green-600 font-medium">{item.completed_visits}</span>
      )
    },
    {
      key: 'missed_visits',
      label: 'Terlewat',
      render: (item) => (
        <span className="text-red-600 font-medium">{item.missed_visits}</span>
      )
    },
    {
      key: 'performance_rate',
      label: 'Performance',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(item.performance_rate)}`}>
            {item.performance_rate}%
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(item.performance_rate, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    }
  ]

  const isSiteManager = can(user, 'view_sales_performance')
  const themeColor = isSiteManager ? 'green' : 'red'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit Reports</h1>
          <p className="text-gray-600">Laporan dan analisis kunjungan sales</p>
        </div>
        
        <Button variant="outline">
          <Download size={16} />
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <div className={`bg-${themeColor}-50 rounded-xl p-6 mb-8 border border-${themeColor}-100`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className={`text-${themeColor}-600`} size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Filter Laporan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periode
            </label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          
          <Input
            label="Tanggal Mulai"
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
          
          <Input
            label="Tanggal Akhir"
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
          
          {isSiteManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sales
              </label>
              <select
                value={filters.sales_id}
                onChange={(e) => handleFilterChange('sales_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Sales</option>
                {salesUsers.map(sales => (
                  <option key={sales.id} value={sales.id}>
                    {sales.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {reportData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`bg-${themeColor}-50 rounded-xl p-6 border border-${themeColor}-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Visits</p>
                <p className={`text-2xl font-bold text-${themeColor}-700`}>{reportData.summary.total_visits}</p>
              </div>
              <div className={`w-12 h-12 bg-${themeColor}-600 rounded-lg flex items-center justify-center`}>
                <Calendar className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-700">{reportData.summary.completed_visits}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Missed</p>
                <p className="text-2xl font-bold text-red-700">{reportData.summary.missed_visits}</p>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Performance Rate</p>
                <p className="text-2xl font-bold text-blue-700">{reportData.summary.performance_rate}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Data */}
      {reportData?.period_data && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className={`text-${themeColor}-600`} size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Data Per Periode</h2>
          </div>
          
          <DataTable
            columns={periodColumns}
            data={reportData.period_data}
            loading={loading}
            emptyMessage="Tidak ada data untuk periode ini"
          />
        </div>
      )}

      {/* Sales Performance (Site Manager Only) */}
      {isSiteManager && salesPerformance.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Performance Sales</h2>
          </div>
          
          <DataTable
            columns={salesColumns}
            data={salesPerformance}
            loading={loading}
            emptyMessage="Tidak ada data performance sales"
          />
        </div>
      )}
    </div>
  )
}