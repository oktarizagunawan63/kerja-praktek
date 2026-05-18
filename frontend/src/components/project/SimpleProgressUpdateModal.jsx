import { useState, useEffect, useRef } from 'react'
import { Camera, Package, FileText, CheckCircle, Plus, X } from '@icons'
import Button from '../ui/Button'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

export default function SimpleProgressUpdateModal({
  open,
  onClose,
  project,
  onSaved,
}) {
  const [step, setStep] = useState(1) // 1: Materials, 2: Photo & Notes, 3: Review
  const [materials, setMaterials] = useState([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: '', qty_plan: '', qty_terpasang: '0' })
  const selectRef = useRef(null)
  
  const [form, setForm] = useState({
    selectedMaterials: [], // [{ material_id, qty_added, notes }]
    photo: null,
    notes: '',
    planName: ''
  })

  useEffect(() => {
    if (!open || !project?.id) return

    setForm({
      selectedMaterials: [],
      photo: null,
      notes: '',
      planName: ''
    })
    setStep(1)

    const fetchMaterials = async () => {
      try {
        setLoadingMaterials(true)
        const response = await api.getMaterials({ project_id: project.id })
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : []
        setMaterials(data)
      } catch (error) {
        console.error('Failed to fetch materials:', error)
        setMaterials([])
      } finally {
        setLoadingMaterials(false)
      }
    }

    fetchMaterials()
  }, [open, project?.id])

  const handleAddMaterial = (materialId) => {
    const material = materials.find(m => m.id === parseInt(materialId))
    if (!material) return

    const existing = form.selectedMaterials.find(m => parseInt(m.material_id) === parseInt(materialId))
    if (existing) {
      toast.error('Material sudah ditambahkan')
      return
    }

    setForm(prev => ({
      ...prev,
      selectedMaterials: [
        ...prev.selectedMaterials,
        { 
          material_id: materialId, 
          material_name: material.name,
          material_unit: material.unit,
          qty_plan: material.qty_plan,
          qty_current: material.qty_terpasang,
          qty_added: '', 
          notes: '' 
        }
      ]
    }))
  }

  const handleRemoveMaterial = (materialId) => {
    setForm(prev => ({
      ...prev,
      selectedMaterials: prev.selectedMaterials.filter(m => m.material_id !== materialId)
    }))
  }

  const handleUpdateMaterial = (materialId, field, value) => {
    setForm(prev => ({
      ...prev,
      selectedMaterials: prev.selectedMaterials.map(m =>
        m.material_id === materialId ? { ...m, [field]: value } : m
      )
    }))
  }

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, photo: event.target?.result || null }))
    }
    reader.readAsDataURL(file)
  }

  const handleAddNewMaterial = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (addingMaterial) return
    
    if (!newMaterial.name?.trim() || !newMaterial.unit?.trim() || !newMaterial.qty_plan) {
      toast.error('Lengkapi semua field material')
      return
    }

    try {
      setAddingMaterial(true)
      
      const response = await api.createMaterial({
        project_id: project.id,
        name: newMaterial.name.trim(),
        unit: newMaterial.unit.trim(),
        qty_plan: Number(newMaterial.qty_plan),
        qty_terpasang: Number(newMaterial.qty_terpasang) || 0
      })

      if (response.success || response.id) {
        toast.success(`Material ${newMaterial.name} berhasil ditambahkan`)
        setShowAddMaterialModal(false)
        setNewMaterial({ name: '', unit: '', qty_plan: '', qty_terpasang: '0' })
        
        // Refresh materials list
        const materialsResponse = await api.getMaterials({ project_id: project.id })
        const data = Array.isArray(materialsResponse)
          ? materialsResponse
          : Array.isArray(materialsResponse?.data)
            ? materialsResponse.data
            : []
        setMaterials(data)
        
        // Reset dropdown value
        if (selectRef.current) {
          selectRef.current.value = ''
        }
      } else {
        toast.error(response.message || 'Gagal menambahkan material')
      }
    } catch (error) {
      console.error('Failed to add material:', error)
      toast.error(error?.message || 'Gagal menambahkan material')
    } finally {
      setAddingMaterial(false)
    }
  }

  const calculateProgress = () => {
    if (form.selectedMaterials.length === 0) return 0

    const totalProgress = form.selectedMaterials.reduce((sum, item) => {
      const material = materials.find(m => m.id === parseInt(item.material_id))
      if (!material) return sum

      const qtyPlan = Number(material.qty_plan) || 0
      if (qtyPlan <= 0) return sum

      const currentQty = Number(material.qty_terpasang) || 0
      const addedQty = Number(item.qty_added) || 0
      const newTotal = Math.min(currentQty + addedQty, qtyPlan)
      const progress = (newTotal / qtyPlan) * 100

      return sum + progress
    }, 0)

    return Math.round(totalProgress / form.selectedMaterials.length)
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      // Validation
      if (form.selectedMaterials.length === 0) {
        toast.error('Pilih minimal 1 material yang dipasang')
        return
      }

      const hasInvalidQty = form.selectedMaterials.some(m => !m.qty_added || Number(m.qty_added) <= 0)
      if (hasInvalidQty) {
        toast.error('Isi jumlah yang dipasang untuk semua material')
        return
      }

      if (!form.photo) {
        toast.error('Foto wajib diupload')
        return
      }

      if (!form.planName?.trim()) {
        toast.error('Nama pekerjaan wajib diisi')
        return
      }

      // Prepare data
      const plan_updates = [{
        name: form.planName.trim(),
        items: form.selectedMaterials.map(item => ({
          material_id: parseInt(item.material_id),
          qty_terpasang: Number(item.qty_added),
          catatan: item.notes?.trim() || ''
        }))
      }]

      const response = await api.submitProgressReport({
        project_id: project.id,
        progress_percentage: calculateProgress(),
        notes: form.notes?.trim() || '',
        photo: form.photo,
        plan_updates
      })

      if (response.success) {
        toast.success('Progress berhasil diupdate!')
        onSaved?.(response.data)
        onClose?.()
      } else {
        toast.error(response.message || 'Gagal menyimpan progress')
      }
    } catch (error) {
      console.error('Failed to submit progress:', error)
      toast.error(error?.message || 'Gagal menyimpan progress')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const progress = calculateProgress()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Update Progress</h3>
              <p className="text-sm text-blue-100 mt-1">{project?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={submitting}
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white mb-2">
              <span>Progress Hari Ini</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Material', icon: Package },
              { num: 2, label: 'Foto & Catatan', icon: Camera },
              { num: 3, label: 'Review', icon: CheckCircle }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <s.icon size={20} />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step >= s.num ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`h-1 flex-1 mx-2 rounded ${
                    step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Materials */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Pekerjaan Hari Ini <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.planName}
                  onChange={(e) => setForm(prev => ({ ...prev, planName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Material yang Dipasang
                </label>
                <div className="flex gap-2">
                  <select
                    ref={selectRef}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMaterial(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loadingMaterials || submitting}
                    value=""
                  >
                    <option value="">+ Tambah Material</option>
                    {materials
                      .filter(material => !form.selectedMaterials.some(sm => parseInt(sm.material_id) === parseInt(material.id)))
                      .map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.unit}) - Sisa: {Math.max(0, material.qty_plan - material.qty_terpasang)}
                        </option>
                      ))
                    }
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddMaterialModal(true)}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || addingMaterial}
                  >
                    <Plus size={18} />
                    Material Baru
                  </button>
                </div>
              </div>

              {/* Selected Materials */}
              {form.selectedMaterials.length > 0 && (
                <div className="space-y-3 mt-4">
                  {form.selectedMaterials.map((item) => (
                    <div key={item.material_id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.material_name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Terpasang: {item.qty_current} / {item.qty_plan} {item.material_unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMaterial(item.material_id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                          disabled={submitting}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Jumlah Dipasang *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.qty_added}
                            onChange={(e) => handleUpdateMaterial(item.material_id, 'qty_added', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Catatan (Optional)
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleUpdateMaterial(item.material_id, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Lokasi, dll"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {materials.length === 0 && !loadingMaterials && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Package size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">Belum ada material</p>
                  <p className="text-sm text-gray-500 mt-1">Hubungi Site Manager untuk menambahkan material</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Photo & Notes */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto Pekerjaan <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                  {form.photo ? (
                    <div className="relative">
                      <img
                        src={form.photo}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setForm(prev => ({ ...prev, photo: null }))}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        disabled={submitting}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Camera size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">Klik untuk ambil foto</p>
                      <p className="text-sm text-gray-500 mt-1">atau pilih dari galeri</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoCapture}
                        className="hidden"
                        disabled={submitting}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan Tambahan (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Tambahkan catatan jika ada kendala atau informasi penting..."
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle size={64} className="mx-auto text-green-600 mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Progress: {progress}%</h3>
                <p className="text-gray-600">Siap untuk disimpan!</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Pekerjaan</p>
                  <p className="font-semibold text-gray-900">{form.planName}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Material Dipasang</p>
                  {form.selectedMaterials.map(item => (
                    <div key={item.material_id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-700">{item.material_name}</span>
                      <span className="font-medium text-gray-900">
                        {item.qty_added} {item.material_unit}
                      </span>
                    </div>
                  ))}
                </div>

                {form.notes && (
                  <div>
                    <p className="text-xs text-gray-500">Catatan</p>
                    <p className="text-sm text-gray-700">{form.notes}</p>
                  </div>
                )}

                {form.photo && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Foto</p>
                    <img
                      src={form.photo}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          {step > 1 && (
            <Button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={submitting}
            >
              Kembali
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={() => {
                if (step === 1 && form.selectedMaterials.length === 0) {
                  toast.error('Pilih minimal 1 material')
                  return
                }
                if (step === 1 && !form.planName?.trim()) {
                  toast.error('Isi nama pekerjaan')
                  return
                }
                setStep(step + 1)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={submitting}
            >
              Lanjut
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Progress'}
            </Button>
          )}
        </div>
      </div>

      {/* Modal: Tambah Material Baru */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
              <h3 className="text-xl font-bold text-white">Tambah Material Baru</h3>
              <p className="text-sm text-green-100 mt-1">Tambahkan material yang belum ada di daftar</p>
            </div>
            
            <form onSubmit={handleAddNewMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Material <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={addingMaterial}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={addingMaterial}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Rencana <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterial.qty_plan}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, qty_plan: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  disabled={addingMaterial}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Terpasang (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterial.qty_terpasang}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, qty_terpasang: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  disabled={addingMaterial}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMaterialModal(false)
                    setNewMaterial({ name: '', unit: '', qty_plan: '', qty_terpasang: '0' })
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium"
                  disabled={addingMaterial}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={addingMaterial}
                >
                  {addingMaterial ? 'Menambahkan...' : 'Tambah Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
