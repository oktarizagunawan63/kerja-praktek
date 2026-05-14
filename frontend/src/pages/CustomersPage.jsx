import { useState, useEffect } from 'react'
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Eye } from '@icons'
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
  const [submitting, setSubmitting] = useState(false) // Prevent double submission

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
    
    // Prevent double submission
    if (submitting) return
    
    try {
      setSubmitting(true)
      
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
    } finally {
      setSubmitting(false)
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

  // Auto-geocode address to get lat/long
  const geocodeAddress = async (address) => {
    if (!address || address.length < 10) return
    
    try {
      // Use Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }))
        setLokasiAmbil(true)
        toast.success(`Koordinat: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`, {
          duration: 2000
        })
      } else {
        setLokasiAmbil(false)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setLokasiAmbil(false)
    }
  }

  // Debounce geocoding to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.address && formData.address.length >= 10) {
        geocodeAddress(formData.address)
      }
    }, 1000) // Wait 1 second after user stops typing
    
    return () => clearTimeout(timer)
  }, [formData.address])

  const handleApprove = async (customer) => {
    if (!window.confirm(`Approve customer ${customer.name}?`)) return
    
    try {
      await api.approveCustomer(customer.id)
      toast.success('Customer berhasil di-approve')
      fetchCustomers()
    } catch (error) {
      toast.error(error.message || 'Gagal approve customer')
    }
  }

  const handleReject = async (customer) => {
    const reason = window.prompt('Alasan penolakan (min 10 karakter):')
    if (!reason || reason.length < 10) {
      toast.error('Alasan penolakan wajib diisi minimal 10 karakter')
      return
    }
    
    try {
      await api.rejectCustomer(customer.id, reason)
      toast.success('Customer ditolak')
      fetchCustomers()
    } catch (error) {
      toast.error(error.message || 'Gagal reject customer')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Customer',
      render: (customer) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{customer.name}</p>
            {customer.approval_status === 'pending' && (
              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                Pending
              </span>
            )}
            {customer.approval_status === 'rejected' && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                Rejected
              </span>
            )}
          </div>
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
          {/* Sales Manager and Administrator approval buttons for pending customers */}
          {['sales_manager', 'administrator'].includes(user?.role) && customer.approval_status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(customer)}
                className="px-2 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded"
                title="Approve"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(customer)}
                className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
                title="Reject"
              >
                Reject
              </button>
            </>
          )}
          
          {/* Only sales_manager and admin can edit approved customers */}
          {['sales_manager', 'administrator'].includes(user?.role) && customer.approval_status === 'approved' && (
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
          
          {/* Sales role can only view, cannot edit pending */}
          {user?.role === 'sales' && customer.approval_status === 'pending' && (
            <span className="text-xs text-yellow-700 px-2 py-1 bg-yellow-100 rounded">
              Menunggu Approval
            </span>
          )}
          {user?.role === 'sales' && customer.approval_status === 'approved' && (
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
        
        {/* Sales can create customers (pending approval), sales_manager and admin can create directly */}
        {['sales', 'sales_manager', 'administrator'].includes(user?.role) && (
          <button onClick={() => setShowAddForm(true)} className="btn-responsive primary">
            <Plus size={16} />
            <span className="mobile-hidden">Tambah Customer</span>
            <span className="desktop-hidden tablet-hidden">Tambah</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="card-compact" style={{ background: '#f399cc', borderLeft: '4px solid #de168c' }}>
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
                  placeholder="Alamat lengkap customer... (koordinat akan otomatis terisi)"
                  required
                />
                
                {/* Auto-show coordinates when available */}
                {lokasiAmbil && formData.latitude && formData.longitude && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ðŸ“ {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                  </div>
                )}
              </div>
              
              {/* Hidden latitude/longitude fields */}
              <input type="hidden" value={formData.latitude} />
              <input type="hidden" value={formData.longitude} />
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn-responsive primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : (editingCustomer ? 'Perbarui' : 'Simpan')}
                </button>
                <button
                  type="button"
                  disabled={submitting}
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
                  className="btn-responsive secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
