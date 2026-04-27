import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function FunnelFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '', customer_company: '', customer_phone: '', customer_email: '',
    channel: 'kontraktor', channel_other: '', city: '', province: '',
    segment: 'sot', segment_custom: '', qty: '', unit: 'unit',
    estimated_value: '', deal_stage: 'prospek', deadline_date: '', target_close_date: '',
    win_probability: 'middle', competitor_name: '', competitor_notes: '', initial_notes: '',
    assigned_to: user?.id || ''
  })

  useEffect(() => { if (isEdit) loadFunnel() }, [id])

  const loadFunnel = async () => {
    try {
      const response = await api.getFunnel(id)
      setFormData(response.data)
    } catch (error) {
      toast.error('Gagal memuat data funnel')
      navigate('/funnels')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.updateFunnel(id, formData)
        toast.success('Funnel berhasil diupdate')
      } else {
        await api.createFunnel(formData)
        toast.success('Funnel berhasil dibuat')
      }
      navigate('/funnels')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan funnel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Tambah'} Sales Funnel</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div><h2 className="text-lg font-semibold mb-4">Informasi Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Customer" name="customer_name" value={formData.customer_name} onChange={handleChange} required />
            <Input label="Nama Perusahaan" name="customer_company" value={formData.customer_company} onChange={handleChange} required />
            <Input label="No. Telepon" name="customer_phone" value={formData.customer_phone} onChange={handleChange} />
            <Input label="Email" type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} />
          </div></div>
        <div><h2 className="text-lg font-semibold mb-4">Lokasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
              <select name="channel" value={formData.channel} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="kontraktor">Kontraktor</option><option value="subdist">Subdist</option><option value="rsud">RSUD</option>
                <option value="rs_swasta">RS Swasta</option><option value="klinik">Klinik</option><option value="puskesmas">Puskesmas</option>
                <option value="lainnya">Lainnya</option>
              </select></div>
            {formData.channel === 'lainnya' && <Input label="Channel Lainnya" name="channel_other" value={formData.channel_other} onChange={handleChange} required />}
            <Input label="Kota" name="city" value={formData.city} onChange={handleChange} required />
            <Input label="Provinsi" name="province" value={formData.province} onChange={handleChange} />
          </div></div>
        <div><h2 className="text-lg font-semibold mb-4">Informasi Produk</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Segment *</label>
              <select name="segment" value={formData.segment} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="sot">SOT</option><option value="igvm">IGVM</option><option value="nursecall">Nursecall</option><option value="umum">Umum</option>
              </select></div>
            {formData.segment === 'umum' && <Input label="Segment Custom" name="segment_custom" value={formData.segment_custom} onChange={handleChange} required />}
            <Input label="Quantity" type="number" name="qty" value={formData.qty} onChange={handleChange} required />
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="unit">Unit</option><option value="set">Set</option><option value="pcs">Pcs</option>
              </select></div>
            <Input label="Estimasi Nilai (Rp)" type="number" name="estimated_value" value={formData.estimated_value} onChange={handleChange} required />
          </div></div>
        <div><h2 className="text-lg font-semibold mb-4">Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Deal Stage *</label>
              <select name="deal_stage" value={formData.deal_stage} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="prospek">Prospek</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option>
                <option value="negosiasi">Negosiasi</option><option value="closing">Closing</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Win Probability *</label>
              <select name="win_probability" value={formData.win_probability} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="low">Low (25%)</option><option value="middle">Middle (50%)</option><option value="high">High (75%)</option><option value="very_high">Very High (90%)</option>
              </select></div>
            <Input label="Deadline Customer" type="date" name="deadline_date" value={formData.deadline_date} onChange={handleChange} required />
            <Input label="Target Close Date" type="date" name="target_close_date" value={formData.target_close_date} onChange={handleChange} required />
          </div></div>
        <div><h2 className="text-lg font-semibold mb-4">Kompetitor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Kompetitor" name="competitor_name" value={formData.competitor_name} onChange={handleChange} />
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Catatan Kompetitor</label>
              <textarea name="competitor_notes" value={formData.competitor_notes} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-md" />
            </div></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan Awal Kebutuhan *</label>
          <textarea name="initial_notes" value={formData.initial_notes} onChange={handleChange} rows="4" className="w-full px-3 py-2 border rounded-md" required /></div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate('/funnels')}>Batal</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}</Button>
        </div>
      </form>
    </div>
  )
}