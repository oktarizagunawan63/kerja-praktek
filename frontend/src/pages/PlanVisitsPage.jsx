import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MapPin, User, Edit, Trash2, Eye } from 'lucide-react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

export default function PlanVisitsPage() {
  const { user } = useAuthStore()
  const [planVisits, setPlanVisits] = useState([])
  const [customers, setCustomers] = useState([])
  const [salesUsers, setSalesUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [formData, setFormData] = useState({
    customer_id: '',
    assigned_to: '',
    tanggal_visit: '',
    waktu_visit: '',
    lokasi: '',
    tujuan: '',
    catatan: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch plan visits with fallback
      try {
        const visitsResponse = await api.getPlanVisits({ search: searchQuery })
        const visitsData = visitsResponse.data?.data || visitsResponse.data || []
        setPlanVisits(visitsData)
      } catch (error) {
        console.warn('Plan visits API failed:', error.message)
        setPlanVisits([])
      }
      
      // Fetch customers with fallback
      try {
        const customersResponse = await api.getCustomers()
        const customersData = customersResponse.data?.data || customersResponse.data || []
        setCustomers(customersData)
      } catch (error) {
        console.warn('Customers API failed:', error.message)
        setCustomers([])
      }
      
      // Fetch sales users with fallback (for Sales Manager)
      if (can(user, 'assign_visits')) {
        try {
          const salesResponse = await api.getSalesUsers()
          const salesData = salesResponse.data || []
          setSalesUsers(salesData)
        } catch (error) {
          console.warn('Sales users API failed:', error.message)
          setSalesUsers([])
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't show toast error for data loading issues
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = { ...formData }
      
      // Auto-assign to current user if sales
      if (user.role === 'sales' && !submitData.assigned_to) {
        submitData.assigned_to = user.id
      }
      
      if (editingVisit) {
        await api.updatePlanVisit(editingVisit.id, submitData)
        toast.success('Plan visit berhasil diperbarui')
      } else {
        await api.createPlanVisit(submitData)
        toast.success('Plan visit berhasil ditambahkan')
      }
      
      setShowAddForm(false)
      setEditingVisit(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan plan visit')
    }
  }

  const handleEdit = (visit) => {
    setEditingVisit(visit)
    setFormData({
      customer_id: visit.customer_id || '',
      assigned_to: visit.assigned_to || '',
      tanggal_visit: visit.tanggal_visit ? visit.tanggal_visit.split('T')[0] : '',
      waktu_visit: visit.waktu_visit || '',
      lokasi: visit.lokasi || '',
      tujuan: visit.tujuan || '',
      catatan: visit.catatan || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (visit) => {
    if (!window.confirm(`Hapus plan visit ke ${visit.customer?.name}?`)) return
    
    try {
      await api.deletePlanVisit(visit.id)
      toast.success('Plan visit berhasil dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus plan visit')
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: '',
      assigned_to: '',
      tanggal_visit: '',
      waktu_visit: '',
      lokasi: '',
      tujuan: '',
      catatan: ''
    })
  }

  const getStatusBadge = (visit) => {
    if (visit.realisasi) {
      const status = visit.realisasi.status
      return (
        <span className={`text-xs px-2 py-1 rounded-full ${
          status === 'done' ? 'bg-green-100 text-green-700' :
          status === 'missed' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {status === 'done' ? 'Selesai' : status === 'missed' ? 'Terlewat' : 'Pending'}
        </span>
      )
    }
    
    const visitDate = new Date(visit.tanggal_visit)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (visitDate < today) {
      return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Overdue</span>
    }
    
    return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Scheduled</span>
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (visit) => (
        <div>
          <p className="font-medium text-gray-900">{visit.customer?.name}</p>
          <p className="text-sm text-gray-500">{visit.customer?.company}</p>
        </div>
      )
    },
    {
      key: 'schedule',
      label: 'Jadwal',
      render: (visit) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {new Date(visit.tanggal_visit).toLocaleDateString('id-ID')}
            </p>
            {visit.waktu_visit && (
              <p className="text-xs text-gray-500">{visit.waktu_visit}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Lokasi',
      render: (visit) => (
        <div className="flex items-start gap-1">
          <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
          <span className="text-sm text-gray-600">{visit.lokasi}</span>
        </div>
      )
    },
    {
      key: 'assigned',
      label: 'Assigned To',
      render: (visit) => (
        <div className="flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            {visit.assigned_to_user?.name || 'Unassigned'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (visit) => getStatusBadge(visit)
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (visit) => (
        <div className="flex items-center gap-2">
          {can(user, 'edit_plan_visit') && (
            <button
              onClick={() => handleEdit(visit)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit size={14} />
            </button>
          )}
          {can(user, 'delete_plan_visit') && (
            <button
              onClick={() => handleDelete(visit)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    }
  ]

  const isSiteManager = can(user, 'assign_visits')
  const themeColor = isSiteManager ? 'green' : 'red'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Visit Management</h1>
          <p className="text-gray-600">
            {isSiteManager ? 'Kelola rencana kunjungan sales' : 'Kelola rencana kunjungan Anda'}
          </p>
        </div>
        
        {can(user, 'create_plan_visit') && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className={`bg-${themeColor}-600 hover:bg-${themeColor}-700`}
          >
            <Plus size={16} />
            Tambah Plan Visit
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cari customer atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchData()}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={planVisits}
        loading={loading}
        emptyMessage="Belum ada plan visit"
      />

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingVisit ? 'Edit Plan Visit' : 'Tambah Plan Visit'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.company}
                    </option>
                  ))}
                </select>
              </div>

              {isSiteManager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To Sales
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Sales</option>
                    {salesUsers.map(sales => (
                      <option key={sales.id} value={sales.id}>
                        {sales.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tanggal Visit"
                  type="date"
                  value={formData.tanggal_visit}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal_visit: e.target.value }))}
                  required
                />
                
                <Input
                  label="Waktu Visit"
                  type="time"
                  value={formData.waktu_visit}
                  onChange={(e) => setFormData(prev => ({ ...prev, waktu_visit: e.target.value }))}
                />
              </div>
              
              <Input
                label="Lokasi"
                value={formData.lokasi}
                onChange={(e) => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
                placeholder="Alamat lokasi visit"
                required
              />
              
              <Input
                label="Tujuan Visit"
                value={formData.tujuan}
                onChange={(e) => setFormData(prev => ({ ...prev, tujuan: e.target.value }))}
                placeholder="Tujuan kunjungan"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingVisit ? 'Perbarui' : 'Simpan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingVisit(null)
                    resetForm()
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}