import { useState, useEffect } from 'react'
import { Camera, MapPin, ArrowLeft, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import CameraAttendance from '../components/ui/CameraAttendance'
import toast from 'react-hot-toast'
import { formatRupiah } from '../lib/formatRupiah'

export default function CreateUnplannedVisitPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [photoData, setPhotoData] = useState(null)
  
  const [formData, setFormData] = useState({
    customer_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    actual_duration: '',
    visit_purpose: '',
    meeting_notes: '',
    visit_outcome: '',
    deal_amount: '',
    deal_notes: '',
    latitude: null,
    longitude: null
  })
  
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await api.getCustomers()
      const customersData = response.data?.data || response.data || []
      // Only show approved customers
      const approvedCustomers = customersData.filter(c => c.approval_status === 'approved')
      setCustomers(Array.isArray(approvedCustomers) ? approvedCustomers : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Gagal memuat data customer')
    } finally {
      setLoading(false)
    }
  }

  const handleCameraCapture = (captureData) => {
    setPhotoData(captureData)
    setFormData(prev => ({
      ...prev,
      latitude: captureData.latitude,
      longitude: captureData.longitude
    }))
    setShowCamera(false)
    toast.success('Foto berhasil diambil dengan GPS location!')
  }

  const handleCameraCancel = () => {
    setShowCamera(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (submitting) return
    
    // Validations
    if (!formData.customer_id) {
      toast.error('Pilih customer terlebih dahulu')
      return
    }
    
    if (!formData.visit_date) {
      toast.error('Tanggal visit wajib diisi')
      return
    }
    
    const visitDate = new Date(formData.visit_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (visitDate > today) {
      toast.error('Tanggal visit tidak boleh masa depan')
      return
    }
    
    if (!formData.visit_time) {
      toast.error('Waktu visit wajib diisi')
      return
    }
    
    if (!formData.actual_duration || parseInt(formData.actual_duration) <= 0) {
      toast.error('Durasi visit harus lebih dari 0 menit')
      return
    }
    
    if (!formData.visit_purpose || formData.visit_purpose.trim().length < 10) {
      toast.error('Tujuan visit minimal 10 karakter')
      return
    }
    
    if (!formData.meeting_notes || formData.meeting_notes.trim().length < 10) {
      toast.error('Catatan meeting minimal 10 karakter')
      return
    }
    
    if (!formData.visit_outcome) {
      toast.error('Pilih hasil visit')
      return
    }
    
    if (formData.visit_outcome === 'closed') {
      if (!formData.deal_amount || parseFloat(formData.deal_amount) <= 0) {
        toast.error('Deal amount wajib diisi untuk closed deal')
        return
      }
    }
    
    if (!photoData || !photoData.photo) {
      toast.error('Foto bukti visit wajib diambil')
      return
    }
    
    if (!formData.latitude || !formData.longitude) {
      toast.error('GPS location tidak terdeteksi, ambil foto ulang')
      return
    }
    
    try {
      setSubmitting(true)
      
      const submitData = {
        customer_id: parseInt(formData.customer_id),
        visit_date: formData.visit_date,
        visit_time: `${formData.visit_date} ${formData.visit_time}:00`,
        actual_duration: parseInt(formData.actual_duration),
        visit_purpose: formData.visit_purpose.trim(),
        meeting_notes: formData.meeting_notes.trim(),
        visit_outcome: formData.visit_outcome,
        deal_amount: formData.visit_outcome === 'closed' ? parseFloat(formData.deal_amount) : null,
        deal_notes: formData.visit_outcome === 'closed' ? formData.deal_notes : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photos: [photoData.photo]
      }
      
      console.log('Submitting unplanned visit:', submitData)
      
      const response = await api.createUnplannedVisit(submitData)
      
      console.log('Response:', response)
      
      const message = user.role === 'sales' 
        ? 'Unplanned visit berhasil dibuat dan menunggu approval Sales Manager' 
        : 'Unplanned visit berhasil dibuat'
      
      toast.success(message, { duration: 3000 })
      
      // Navigate after short delay to ensure toast is visible
      setTimeout(() => {
        navigate('/realisasi-visits')
      }, 500)
      
    } catch (error) {
      console.error('Submit error:', error)
      console.error('Error response:', error.response?.data)
      
      const errorMessage = error.response?.data?.message || error.message || 'Gagal membuat unplanned visit'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/realisasi-visits')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Kembali
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Camera className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Unplanned Visit</h1>
            <p className="text-gray-600">Dokumentasi kunjungan tidak terencana</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Informasi Customer</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => {
                  const customerId = e.target.value
                  const customer = customers.find(c => c.id === parseInt(customerId))
                  setFormData(prev => ({ ...prev, customer_id: customerId }))
                  setSelectedCustomer(customer || null)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">-- Pilih Customer --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.company || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Display Selected Customer Info */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Detail Customer</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Nama:</span>
                    <span className="font-medium text-gray-900">{selectedCustomer.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Perusahaan:</span>
                    <span className="font-medium text-gray-900">{selectedCustomer.company || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Telepon:</span>
                    <span className="font-medium text-gray-900">{selectedCustomer.phone || '-'}</span>
                  </div>
                  {selectedCustomer.address && (
                    <div className="flex">
                      <span className="w-32 text-gray-600">Alamat:</span>
                      <span className="font-medium text-gray-900">{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visit Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Detail Kunjungan</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Visit <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Visit <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.visit_time}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durasi (menit) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.actual_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, actual_duration: e.target.value }))}
              min="1"
              step="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: 60"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tujuan Kunjungan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.visit_purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, visit_purpose: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Jelaskan tujuan kunjungan..."
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.visit_purpose.length}/10 karakter minimum
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Meeting <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.meeting_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="Detail diskusi, pain points, objections, agreements, next steps..."
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.meeting_notes.length}/10 karakter minimum
            </p>
          </div>
        </div>

        {/* Visit Outcome */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Hasil Kunjungan</h2>
          
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all border-gray-200 hover:border-gray-300 data-[selected=true]:border-green-500 data-[selected=true]:bg-green-50"
              data-selected={formData.visit_outcome === 'closed'}>
              <input type="radio" name="visit_outcome" value="closed"
                checked={formData.visit_outcome === 'closed'}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                className="mt-1" required />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Closed (Deal)</p>
                <p className="text-sm text-gray-600">Customer setuju & deal ditutup</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all border-gray-200 hover:border-gray-300 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50"
              data-selected={formData.visit_outcome === 'follow_up'}>
              <input type="radio" name="visit_outcome" value="follow_up"
                checked={formData.visit_outcome === 'follow_up'}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                className="mt-1" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Follow-up</p>
                <p className="text-sm text-gray-600">Masih ada pembahasan lanjut</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all border-gray-200 hover:border-gray-300 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-50"
              data-selected={formData.visit_outcome === 'not_interested'}>
              <input type="radio" name="visit_outcome" value="not_interested"
                checked={formData.visit_outcome === 'not_interested'}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                className="mt-1" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Not Interested</p>
                <p className="text-sm text-gray-600">Customer tidak tertarik</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all border-gray-200 hover:border-gray-300 data-[selected=true]:border-yellow-500 data-[selected=true]:bg-yellow-50"
              data-selected={formData.visit_outcome === 'rescheduled'}>
              <input type="radio" name="visit_outcome" value="rescheduled"
                checked={formData.visit_outcome === 'rescheduled'}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                className="mt-1" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Rescheduled</p>
                <p className="text-sm text-gray-600">Pertemuan dijadwalkan ulang</p>
              </div>
            </label>
          </div>

          {/* Deal Amount - Conditional */}
          {formData.visit_outcome === 'closed' && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Amount (IDR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.deal_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, deal_amount: e.target.value }))}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="450000000"
                    required
                  />
                </div>
                {formData.deal_amount && (
                  <p className="text-sm text-green-600 mt-2 font-semibold">
                    {formatRupiah(parseInt(formData.deal_amount))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Notes (Opsional)
                </label>
                <textarea
                  value={formData.deal_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, deal_notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Contract type, payment terms, timeline..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Photo with GPS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Foto Bukti + GPS Location</h2>
          
          {!photoData ? (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
            >
              <Camera size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-700 font-medium">Ambil Foto dengan Kamera</p>
              <p className="text-sm text-gray-500 mt-1">GPS location akan otomatis terdeteksi</p>
            </button>
          ) : (
            <div className="space-y-4">
              <img 
                src={photoData.photo} 
                alt="Visit photo" 
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
              
              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <MapPin size={20} className="text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">GPS Location Terdeteksi</p>
                    <p className="text-xs text-green-700 font-mono">
                      {formData.latitude}, {formData.longitude}
                    </p>
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Ambil Ulang
              </button>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate('/realisasi-visits')}
            disabled={submitting}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Unplanned Visit'}
          </button>
        </div>
      </form>

      {/* Camera Modal */}
      {showCamera && (
        <CameraAttendance
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
          type="unplanned-visit"
        />
      )}
    </div>
  )
}
