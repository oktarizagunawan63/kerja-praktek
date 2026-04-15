import { useState, useEffect } from 'react'
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Eye } from 'lucide-react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

export default function CustomersPage() {
  const { user } = useAuthStore()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    // Check if user has permission to access customers
    if (!can(user, 'access_visit_management')) {
      setError('You do not have permission to access customer management')
      return
    }
    
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getCustomers({ search: searchQuery })
      
      // Handle both paginated and non-paginated responses
      const customersData = response.data?.data || response.data || []
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError(error.message)
      toast.error(`Gagal memuat data customer: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData)
        toast.success('Customer berhasil diperbarui')
      } else {
        await api.createCustomer(formData)
        toast.success('Customer berhasil ditambahkan')
      }
      
      setShowAddForm(false)
      setEditingCustomer(null)
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        latitude: '',
        longitude: ''
      })
      fetchCustomers()
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan customer')
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      company: customer.company || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      latitude: customer.latitude || '',
      longitude: customer.longitude || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (customer) => {
    if (!window.confirm(`Hapus customer ${customer.name}?`)) return
    
    try {
      await api.deleteCustomer(customer.id)
      toast.success('Customer berhasil dihapus')
      fetchCustomers()
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus customer')
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
          toast.success('Lokasi berhasil diambil')
        },
        (error) => {
          toast.error('Gagal mengambil lokasi')
        }
      )
    } else {
      toast.error('Geolocation tidak didukung browser')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Customer',
      render: (customer) => (
        <div>
          <p className="font-medium text-gray-900">{customer.name}</p>
          {customer.company && (
            <p className="text-sm text-gray-500">{customer.company}</p>
          )}
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Kontak',
      render: (customer) => (
        <div className="space-y-1">
          {customer.phone && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Phone size={12} />
              {customer.phone}
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Mail size={12} />
              {customer.email}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (customer) => (
        <div className="flex items-start gap-1">
          <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
          <span className="text-sm text-gray-600">{customer.address}</span>
        </div>
      )
    },
    {
      key: 'creator',
      label: 'Dibuat Oleh',
      render: (customer) => (
        <span className="text-sm text-gray-600">
          {customer.creator?.name || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(customer)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          {can(user, 'delete_customer') && (
            <button
              onClick={() => handleDelete(customer)}
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

  // Check permissions first
  if (!can(user, 'access_visit_management')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You do not have permission to access customer management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer List</h1>
          <p className="text-gray-600">Kelola data customer untuk visit management</p>
        </div>
        
        {can(user, 'create_customer') && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus size={16} />
            Tambah Customer
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <div>
              <p className="font-medium text-red-800">Error Loading Customers</p>
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={fetchCustomers}
                className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cari customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchCustomers()}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="Belum ada data customer"
      />

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Tambah Customer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Customer"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              
              <Input
                label="Perusahaan"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
              
              <Input
                label="Nomor Telepon"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                />
                
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="w-full"
              >
                <MapPin size={16} />
                Ambil Lokasi Saat Ini
              </Button>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCustomer ? 'Perbarui' : 'Simpan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingCustomer(null)
                    setFormData({
                      name: '',
                      company: '',
                      phone: '',
                      email: '',
                      address: '',
                      latitude: '',
                      longitude: ''
                    })
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