import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '../lib/api'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function FunnelFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_company: '',
    customer_phone: '',
    customer_email: '',
    channel: '',
    channel_other: '',
    city: '',
    segment: '',
    segment_custom: '',
    qty: '',
    unit: '',
    deal_stage: 'prospek',
    target_close_date: '',
    win_probability: 'middle',
    notes: ''
  })

  useEffect(() => {
    if (isEdit) {
      fetchFunnel()
    }
  }, [id])

  const fetchFunnel = async () => {
    try {
      setLoading(true)
      const response = await api.getFunnel(id)
      const funnel = response.data
      
      setFormData({
        customer_name: funnel.customer_name || '',
        customer_company: funnel.customer_company || '',
        customer_phone: funnel.customer_phone || '',
        customer_email: funnel.customer_email || '',
        channel: funnel.channel || '',
        channel_other: funnel.channel_other || '',
        city: funnel.city || '',
        segment: funnel.segment || '',
        segment_custom: funnel.segment_custom || '',
        qty: funnel.qty || '',
        unit: funnel.unit || '',
        deal_stage: funnel.deal_stage || 'prospek',
        target_close_date: funnel.target_close_date || '',
        win_probability: funnel.win_probability || 'middle',
        notes: funnel.notes || ''
      })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.customer_name.trim()) {
      toast.error('Nama customer harus diisi')
      return
    }
    
    if (!formData.customer_company.trim()) {
      toast.error('Nama perusahaan harus diisi')
      return
    }
    
    if (!formData.channel) {
      toast.error('Channel harus dipilih')
      return
    }
    
    if (formData.channel === 'lainnya' && !formData.channel_other.trim()) {
      toast.error('Channel lainnya harus diisi')
      return
    }
    
    if (!formData.city.trim()) {
      toast.error('Daerah harus diisi')
      return
    }
    
    if (!formData.segment) {
      toast.error('Segment harus dipilih')
      return
    }
    
    if (formData.segment === 'umum' && !formData.segment_custom.trim()) {
      toast.error('Segment custom harus diisi')
      return
    }
    
    if (!formData.qty || formData.qty <= 0) {
      toast.error('QTY harus diisi dengan angka positif')
      return
    }
    
    if (!formData.unit.trim()) {
      toast.error('Unit harus diisi')
      return
    }
    
    if (!formData.target_close_date) {
      toast.error('Target close date harus diisi')
      return
    }

    try {
      setLoading(true)
      
      if (isEdit) {
        await api.updateFunnel(id, formData)
        toast.success('Funnel berhasil diupdate')
      } else {
        await api.createFunnel(formData)
        toast.success('Funnel berhasil ditambahkan')
      }
      
      navigate('/funnels')
    } catch (error) {
      console.error('Error saving funnel:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan funnel')
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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Customer <span className="text-red-500">*</span>
              </label>
              <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Nama lengkap customer" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Perusahaan <span className="text-red-500">*</span>
              </label>
              <input type="text" name="customer_company" value={formData.customer_company} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Nama perusahaan" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
              <input type="tel" name="customer_phone" value={formData.customer_phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="email@example.com" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Deal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel <span className="text-red-500">*</span></label>
              <select name="channel" value={formData.channel} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required>
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
                <input type="text" name="channel_other" value={formData.channel_other} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Sebutkan channel" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daerah <span className="text-red-500">*</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Kota/Kabupaten" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Segment <span className="text-red-500">*</span></label>
              <select name="segment" value={formData.segment} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required>
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
                <input type="text" name="segment_custom" value={formData.segment_custom} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Sebutkan segment" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QTY <span className="text-red-500">*</span></label>
              <input type="number" name="qty" value={formData.qty} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Jumlah" min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit <span className="text-red-500">*</span></label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="pcs, set, unit, dll" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deal Stage <span className="text-red-500">*</span></label>
              <select name="deal_stage" value={formData.deal_stage} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required>
                <option value="prospek">Prospek</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negosiasi">Negosiasi</option>
                <option value="closing">Closing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Close Date <span className="text-red-500">*</span></label>
              <input type="date" name="target_close_date" value={formData.target_close_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Win Probability <span className="text-red-500">*</span></label>
              <select name="win_probability" value={formData.win_probability} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required>
                <option value="low">Low</option>
                <option value="middle">Middle</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Catatan tambahan..." />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
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
