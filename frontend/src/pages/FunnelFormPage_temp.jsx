import { useState, useEffect } from 'react'
import { FileText, Calendar, Clock, DollarSign, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { can } from '../lib/permissions'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'
import { formatRupiah } from '../lib/formatRupiah'

export default function CreateVisitRecordPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [approvedPlans, setApprovedPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  
  const [formData, setFormData] = useState({
    plan_visit_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    actual_duration: '',
    meeting_notes: '',
    visit_outcome: '',
    deal_amount: '',
    deal_notes: ''
  })

  useEffect(() => {
    if (!can(user, 'create_realisasi_visit')) {
      navigate('/dashboard')
      return
    }
    fetchApprovedPlans()
  }, [])

  const fetchApprovedPlans = async () => {
    try {
      setLoading(true)
      const response = await api.getApprovedPlanVisits()
      const plans = response.data?.data || response.data || []
      setApprovedPlans(Array.isArray(plans) ? plans : [])
    } catch (error) {
      console.error('Error fetching approved plans:', error)
      toast.error('Gagal memuat plan visits')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = (planId) => {
    const plan = approvedPlans.find(p => p.id === parseInt(planId))
    setSelectedPlan(plan)
    setFormData(prev => ({ ...prev, plan_visit_id: planId }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validations
    if (!formData.plan_visit_id) {
      toast.error('Please select a plan visit')
      return
    }
    
    if (!formData.visit_date) {
      toast.error('Visit date must be today or earlier')
      return
    }
    
    const visitDate = new Date(formData.visit_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (visitDate > today) {
      toast.error('Visit date must be today or earlier')
      return
    }
    
    if (!formData.actual_duration || parseInt(formData.actual_duration) <= 0) {
      toast.error('Duration must be greater than 0 minutes')
      return
    }
    
    if (!formData.meeting_notes || formData.meeting_notes.trim().length < 10) {
      toast.error('Meeting notes required (min 10 characters)')
      return
    }
    
    if (!formData.visit_outcome) {
      toast.error('Please select visit outcome')
      return
    }
    
    if (formData.visit_outcome === 'closed') {
      if (!formData.deal_amount || parseFloat(formData.deal_amount) <= 0) {
        toast.error('Deal amount required for closed deals')
        return
      }
    }
    
    try {
      setSubmitting(true)
      
      const submitData = {
        plan_visit_id: parseInt(formData.plan_visit_id),
        visit_date: formData.visit_date,
        actual_duration: parseInt(formData.actual_duration),
        meeting_notes: formData.meeting_notes.trim(),
        visit_outcome: formData.visit_outcome,
        deal_amount: formData.visit_outcome === 'closed' ? parseFloat(formData.deal_amount) : null,
        deal_notes: formData.visit_outcome === 'closed' ? formData.deal_notes : null
      }
      
      await api.createRealisasiVisit(submitData)
      toast.success('Visit record berhasil dibuat')
      navigate('/realisasi-visits')
      
    } catch (error) {
      toast.error(error.message || 'Gagal membuat visit record')
    } finally {
      setSubmitting(false)
    }
  }

  const getDurationVariance = () => {
    if (!selectedPlan?.durasi || !formData.actual_duration) return null
    
    const planned = parseInt(selectedPlan.durasi)
    const actual = parseInt(formData.actual_duration)
    const diff = actual - planned
    
    if (diff === 0) return { text: 'On schedule', color: 'text-green-600' }
    if (diff > 0) return { text: `+${diff} min (Longer than planned)`, color: 'text-blue-600' }
    return { text: `${diff} min (Shorter than planned)`, color: 'text-yellow-600' }
  }

  const variance = getDurationVariance()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/realisasi-visits')}
          className="mb-4"
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="text-green-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Visit Record</h1>
            <p className="text-gray-600">Dokumentasi realisasi kunjungan sales</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan Visit Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Link ke Plan Visit</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Plan Visit <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.plan_visit_id}
              onChange={(e) => handlePlanSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={loading}
            >
              <option value="">-- Pilih Plan Visit yang Approved --</option>
              {approvedPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.customer?.name || 'Unknown'} - {plan.customer?.company || 'N/A'} 
                  ({new Date(plan.tanggal_visit).toLocaleDateString('id-ID')}, {plan.durasi || 0} min)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hanya menampilkan plan visits dengan status "Approved"
            </p>
          </div>

          {/* Auto-populated Info */}
          {selectedPlan && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{selectedPlan.customer?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">{selectedPlan.customer?.company}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Planned Duration</p>
                  <p className="font-medium text-gray-900">{selectedPlan.durasi} menit</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Planned Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedPlan.tanggal_visit).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Visit Purpose</p>
                  <p className="font-medium text-gray-900">{selectedPlan.tujuan}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sales Owner</p>
                  <p className="font-medium text-gray-900">{selectedPlan.assigned_to_user?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visit Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Detail Visit</h2>
          
          {/* Visit Date */}
          <Input
            label="Visit Date"
            type="date"
            value={formData.visit_date}
            onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            required
            icon={<Calendar size={16} />}
            helperText="Kapan visit actual dilakukan (tidak boleh masa depan)"
          />

          {/* Actual Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Duration (menit) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.actual_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, actual_duration: e.target.value }))}
              min="0"
              step="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: 65"
              required
            />
            {variance && (
              <p className={`text-sm mt-1 ${variance.color} font-medium`}>
                Planned: {selectedPlan.durasi} min | {variance.text}
              </p>
            )}
          </div>

          {/* Meeting Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.meeting_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={6}
              placeholder="Detail diskusi & outcome pembahasan:&#10;- Pain points customer&#10;- Objections yang muncul&#10;- Agreements/commitments&#10;- Next steps&#10;- Contact person details"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Hasil Visit</h2>
          
          <div className="space-y-3">
            {[
              { value: 'closed', label: 'Closed (Deal)', desc: 'Customer setuju & deal ditutup', color: 'green' },
              { value: 'follow_up', label: 'Follow-up', desc: 'Masih ada pembahasan lanjut', color: 'blue' },
              { value: 'not_interested', label: 'Not Interested', desc: 'Customer tidak tertarik', color: 'red' },
              { value: 'rescheduled', label: 'Rescheduled', desc: 'Pertemuan dijadwalkan ulang', color: 'yellow' }
            ].map(outcome => (
              <label
                key={outcome.value}
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.visit_outcome === outcome.value
                    ? `border-${outcome.color}-500 bg-${outcome.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visit_outcome"
                  value={outcome.value}
                  checked={formData.visit_outcome === outcome.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, visit_outcome: e.target.value }))}
                  className={`mt-1 text-${outcome.color}-600`}
                  required
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{outcome.label}</p>
                  <p className="text-sm text-gray-600">{outcome.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Deal Amount & Notes - Conditional */}
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Contract type, payment schedule, implementation timeline, special terms, warranty period, client contact person..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/realisasi-visits')}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={submitting || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Visit Record'}
          </Button>
        </div>
      </form>
    </div>
  )
}
