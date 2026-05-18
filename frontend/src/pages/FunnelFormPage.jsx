import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Search, ChevronDown, X, Users, MapPin } from '@icons'
import { api } from '../lib/api'
import { INDONESIAN_CITIES } from '../constants/cities'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function FunnelFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const dropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_company: '',
    customer_phone: '',
    customer_email: '',
    channel: '',
    channel_other: '',
    city: '',
    province: '',
    segment: '',
    segment_custom: '',
    qty: '',
    unit: 'unit',
    estimated_value: '',
    deal_stage: 'prospek',
    target_close_date: '',
    win_probability: 'middle',
    initial_notes: ''
  })

  useEffect(() => {
    fetchCustomers()
    if (isEdit) fetchFunnel()
  }, [id])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCustomers = async () => {
    try {
      // Try getVisitedCustomers first (more relevant), fallback to all customers
      let data = []
      try {
        const res = await api.getVisitedCustomers()
        data = res.data || []
      } catch {
        const res = await api.getCustomers()
        data = res.data?.data || res.data || []
      }
      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchFunnel = async () => {
    try {
      setLoading(true)
      const response = await api.getFunnel(id)
      const f = response.data
      setFormData({
        customer_id: f.customer_id || '',
        customer_name: f.customer_name || '',
        customer_company: f.customer_company || '',
        customer_phone: f.customer_phone || '',
        customer_email: f.customer_email || '',
        channel: f.channel || '',
        channel_other: f.channel_other || '',
        city: f.city || '',
        segment: f.segment || '',
        segment_custom: f.segment_custom || '',
        qty: f.qty || '',
        unit: f.unit || 'unit',
        deal_stage: f.deal_stage || 'prospek',
        target_close_date: f.target_close_date || '',
        win_probability: f.win_probability || 'middle',
        initial_notes: f.initial_notes || ''
      })
      setCustomerSearch(f.customer_name || '')
    } catch (error) {
      console.error('Error fetching funnel:', error)
      toast.error('Gagal memuat data funnel')
      navigate('/funnels')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowDropdown(false)

    // Try to match customer city to INDONESIAN_CITIES list
    const rawCity = customer.city || customer.address || ''
    const matchedCity = INDONESIAN_CITIES.find(
      c => c.toLowerCase() === rawCity.toLowerCase()
    ) || rawCity

    setFormData(prev => ({
      ...prev,
      customer_id: customer.id || '',
      customer_name: customer.name || '',
      customer_company: customer.company || '',
      customer_phone: customer.phone || '',
      customer_email: customer.email || '',
      city: matchedCity || prev.city || '',
      province: customer.province || prev.province || '',
    }))
    toast.success(`Data ${customer.name} berhasil di-load!`, { duration: 2000 })
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setFormData(prev => ({
      ...prev,
      customer_id: '',
      customer_name: '',
      customer_company: '',
      customer_phone: '',
      customer_email: '',
    }))
  }

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.company?.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customer_name.trim()) return toast.error('Nama customer harus diisi')
    if (!formData.customer_company.trim()) return toast.error('Nama perusahaan harus diisi')
    if (!formData.channel) return toast.error('Channel harus dipilih')
    if (formData.channel === 'lainnya' && !formData.channel_other.trim()) return toast.error('Channel lainnya harus diisi')
    if (!formData.city.trim()) return toast.error('Daerah harus diisi')
    if (!formData.segment) return toast.error('Segment harus dipilih')
    if (formData.segment === 'umum' && !formData.segment_custom.trim()) return toast.error('Segment custom harus diisi')
    if (!formData.qty || formData.qty <= 0) return toast.error('QTY harus diisi dengan angka positif')
    if (!formData.target_close_date) return toast.error('Close date harus diisi')

    try {
      setLoading(true)
      const payload = {
        ...formData,
        deadline_date: formData.target_close_date,
      }

      if (isEdit) {
        await api.updateFunnel(id, payload)
        toast.success('Funnel berhasil diupdate')
      } else {
        await api.createFunnel(payload)
        toast.success('Funnel berhasil ditambahkan')
      }
      navigate('/funnels')
    } catch (error) {
      console.error('Error saving funnel:', error)
      const errMsg = error?.errors
        ? Object.values(error.errors).flat().join(', ')
        : error?.message || 'Gagal menyimpan funnel'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 min-h-screen">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/funnels')} className="mb-4">
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Funnel' : 'Tambah Funnel Baru'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update informasi funnel' : 'Masukkan informasi funnel baru'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

        {/* ===== INFORMASI CUSTOMER ===== */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} className="text-red-500" />
            Informasi Customer
          </h2>

          {/* Customer Searchable Dropdown - full width */}
          <div className="mb-4" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Customer <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-blue-500 font-normal">pilih untuk auto-isi data</span>
            </label>
            <div className="relative">
              <div className={`flex items-center border rounded-lg bg-white overflow-hidden transition-all ${showDropdown ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}>
                <Search size={15} className="ml-3 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomerSearch(val)
                    setFormData(prev => ({ ...prev, customer_name: val }))
                    setShowDropdown(true)
                    if (!val) handleClearCustomer()
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 py-2.5 outline-none text-sm text-gray-900 bg-transparent"
                  placeholder="Cari nama customer dari daftar..."
                />
                {selectedCustomer ? (
                  <button type="button" onClick={handleClearCustomer} className="mr-2 p-1 text-gray-400 hover:text-red-500 rounded">
                    <X size={14} />
                  </button>
                ) : (
                  <ChevronDown size={15} className={`mr-3 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                            {customer.company && (
                              <p className="text-xs text-gray-500 mt-0.5">RS/Perusahaan: {customer.company}</p>
                            )}
                            {(customer.city || customer.address) && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">Lokasi: {customer.city || customer.address}</p>
                            )}
                          </div>
                          {customer.phone && (
                            <span className="text-xs text-gray-400 shrink-0 mt-0.5">Tel: {customer.phone}</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {customerSearch ? `Tidak ditemukan "${customerSearch}" - isi manual di bawah` : 'Ketik untuk mencari customer...'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
                <span>Terisi</span>
                <span>Data <strong>{selectedCustomer.name}</strong> berhasil diisi otomatis dari Customer List</span>
              </div>
            )}
          </div>

          {/* Grid: company, phone, email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama RS / Perusahaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_company"
                value={formData.customer_company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="Nama rumah sakit / perusahaan"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* ===== INFORMASI DEAL ===== */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Deal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel <span className="text-red-500">*</span></label>
              <select name="channel" value={formData.channel} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" required>
                <option value="">Pilih Channel</option>
                <option value="kontraktor">Kontraktor</option>
                <option value="subdist">Subdist</option>
                <option value="rsud">RSUD</option>
                <option value="rs_swasta">RS Swasta</option>
                <option value="klinik">Klinik</option>
                <option value="puskesmas">Puskesmas</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {formData.channel === 'lainnya' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Lainnya <span className="text-red-500">*</span></label>
                <input type="text" name="channel_other" value={formData.channel_other} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="Sebutkan channel" required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daerah / Kota <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white appearance-none"
                  required
                >
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {INDONESIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Segment <span className="text-red-500">*</span></label>
              <select name="segment" value={formData.segment} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" required>
                <option value="">Pilih Segment</option>
                <option value="sot">SOT</option>
                <option value="igvm">IGVM</option>
                <option value="nursecall">NurseCall</option>
                <option value="umum">Umum</option>
              </select>
            </div>

            {formData.segment === 'umum' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Segment Custom <span className="text-red-500">*</span></label>
                <input type="text" name="segment_custom" value={formData.segment_custom} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="Sebutkan segment" required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QTY <span className="text-red-500">*</span></label>
              <input type="number" name="qty" value={formData.qty} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="Jumlah" min="1" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit <span className="text-red-500">*</span></label>
              <select name="unit" value={formData.unit} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" required>
                <option value="unit">Unit</option>
                <option value="set">Set</option>
                <option value="pcs">Pcs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deal Stage <span className="text-red-500">*</span></label>
              <select name="deal_stage" value={formData.deal_stage} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" required>
                <option value="prospek">Prospek</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negosiasi">Negosiasi</option>
                <option value="closing">Closing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Win Probability <span className="text-red-500">*</span></label>
              <select name="win_probability" value={formData.win_probability} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" required>
                <option value="low">Low (25%)</option>
                <option value="middle">Middle (50%)</option>
                <option value="high">High (75%)</option>
                <option value="very_high">Very High (90%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Close Date <span className="text-red-500">*</span></label>
              <input type="date" name="target_close_date" value={formData.target_close_date} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" required />
            </div>
          </div>
        </div>

        {/* ===== CATATAN ===== */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan / Deskripsi
            <span className="ml-2 text-xs text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            name="initial_notes"
            value={formData.initial_notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            placeholder="Deskripsikan kebutuhan, situasi, atau info penting lainnya..."
          />
          {formData.initial_notes.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{formData.initial_notes.length} karakter</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 min-w-[140px]">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Update Funnel' : 'Tambah Funnel'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
