import { useState, useEffect } from 'react'
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Eye } from 'lucide-react'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'
import '../styles/responsive-global.css'

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
    latitude: '', // Hidden field
    longitude: '' // Hidden field
  })
  const [lokasiAmbil, setLokasiAmbil] = useState(false) // FIX 5: Track location status

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
    setLokasiAmbil(!!(customer.latitude && customer.longitude)) // FIX 5: Set location status
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

  // FIX 5: Improved location function with user feedback
  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS')
      return
    }

    toast.loading('Mengambil lokasi...', { id: 'location' })
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }))
        setLokasiAmbil(true)
        toast.success(
          `✅ Lokasi berhasil diambil: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          { id: 'location' }
        )
      },
      (error) => {
        toast.error(`Gagal mengambil lokasi: ${error.message}`, { id: 'location' })
        setLokasiAmbil(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
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
          {/* Only sales_manager and admin can edit customers */}
          {['sales_manager', 'administrator'].includes(user?.role) && (
            <button
              onClick={() => handleEdit(customer)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit size={14} />
            </button>
          )}
          {/* Only sales_manager and admin can delete customers */}
          {['sales_manager', 'administrator'].includes(user?.role) && (
            <button
              onClick={() => handleDelete(customer)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          )}
          {/* Sales role can only view */}
          {user?.role === 'sales' && (
            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
              View Only
            </span>
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
    <div className="container-responsive spacing-md">
      {/* Header */}
      <div className="header-responsive">
        <div>
          <h1 className="header-title">Customer List</h1>
          <p className="header-subtitle">Kelola data customer untuk visit management</p>
        </div>
        
        {/* Only sales_manager and admin can create customers */}
        {['sales_manager', 'administrator'].includes(user?.role) && (
          <button onClick={() => setShowAddForm(true)} className="btn-responsive primary">
            <Plus size={16} />
            <span className="mobile-hidden">Tambah Customer</span>
            <span className="desktop-hidden tablet-hidden">Tambah</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="card-compact" style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <div>
              <p className="text-responsive-base font-medium text-red-800">Error Loading Customers</p>
              <p className="text-responsive-sm text-red-600">{error}</p>
              <button 
                onClick={fetchCustomers}
                className="mt-2 text-responsive-sm text-red-700 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card-compact" style={{ padding: '12px' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            placeholder="Cari customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchCustomers()}
            className="input-responsive pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-compact">
        <div className="table-responsive">
          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            emptyMessage="Belum ada data customer"
          />
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="spacing-lg border-b border-gray-200">
              <h2 className="text-responsive-xl font-semibold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Tambah Customer'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="spacing-lg">
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Nama Customer</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-responsive"
                  placeholder="Nama customer..."
                />
              </div>
              
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Perusahaan</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="input-responsive"
                  placeholder="Nama perusahaan..."
                />
              </div>
              
              <div className="form-row-responsive sm-2">
                <div className="form-group-responsive">
                  <label className="text-responsive-sm font-medium text-gray-700">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-responsive"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                
                <div className="form-group-responsive">
                  <label className="text-responsive-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-responsive"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="form-group-responsive">
                <label className="text-responsive-sm font-medium text-gray-700">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="input-responsive"
                  style={{ minHeight: '80px' }}
                  placeholder="Alamat lengkap customer..."
                  required
                />
              </div>
              
              {/* Hidden latitude/longitude fields */}
              <input type="hidden" value={formData.latitude} />
              <input type="hidden" value={formData.longitude} />
              
              {/* Location button with status feedback */}
              <div className="form-group-responsive">
                <button
                  type="button"
                  onClick={ambilLokasi}
                  className="btn-responsive secondary w-full"
                >
                  <MapPin size={16} />
                  Ambil Lokasi Saat Ini
                </button>
                
                {lokasiAmbil && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-responsive-sm text-green-800">
                      ✅ Lokasi berhasil diambil: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" className="btn-responsive primary flex-1">
                  {editingCustomer ? 'Perbarui' : 'Simpan'}
                </button>
                <button
                  type="button"
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
                    setLokasiAmbil(false)
                  }}
                  className="btn-responsive secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}