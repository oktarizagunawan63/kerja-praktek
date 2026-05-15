import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Package, Target } from '@icons'
import Button from '../ui/Button'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

const EMPTY_ITEM = { id: Date.now(), material_id: '', qty_terpasang: '', catatan: '' }
const EMPTY_PLAN = { id: Date.now(), name: '', items: [{ ...EMPTY_ITEM, id: Date.now() }] }

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
const makeEmptyItem = () => ({ id: Date.now() + Math.random(), material_id: '', qty_terpasang: '', catatan: '' })
const makeEmptyPlan = () => ({ id: Date.now() + Math.random(), name: '', items: [makeEmptyItem()] })

const normalizePlans = (plans = []) => {
  const normalized = plans
    .filter(plan => String(plan?.name || '').trim() !== '')
    .map(plan => ({
      id: plan.id || Date.now() + Math.random(),
      name: String(plan.name || '').trim(),
      items: Array.isArray(plan.items) && plan.items.length > 0
        ? plan.items.map(item => ({
            id: item.id || Date.now() + Math.random(),
            material_id: item.material_id ? String(item.material_id) : '',
            qty_terpasang: item.qty_terpasang ?? '',
            catatan: item.catatan || '',
          }))
        : [{ ...EMPTY_ITEM, id: Date.now() + Math.random() }],
    }))

  return normalized.length > 0 ? normalized : [{ ...EMPTY_PLAN, id: Date.now(), items: [{ ...EMPTY_ITEM, id: Date.now() + Math.random() }] }]
}

export default function ProjectProgressUpdateModal({
  open,
  onClose,
  project,
  initialProgress = 0,
  onSaved,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [materials, setMaterials] = useState([])
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: '', qty_plan: '', qty_terpasang: '0' })
  const [form, setForm] = useState({
    progress_percentage: initialProgress,
    notes: '',
    photo: null,
    plan_updates: [EMPTY_PLAN],
  })

  useEffect(() => {
    if (!open || !project?.id) return

    setForm({
      progress_percentage: initialProgress || 0,
      notes: '',
      photo: null,
      plan_updates: [makeEmptyPlan()],
    })

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
        console.error('Failed to fetch project materials:', error)
        setMaterials([])
      } finally {
        setLoadingMaterials(false)
      }
    }

    fetchMaterials()
  }, [open, project?.id, initialProgress])

  const materialMap = useMemo(
    () => Object.fromEntries(materials.map(material => [String(material.id), material])),
    [materials]
  )

  const getMaterialProgress = (item) => {
    const material = materialMap[String(item.material_id)]
    if (!material) return 0

    const plannedQty = Number(material.qty_plan) || 0
    if (plannedQty <= 0) return 0

    const currentQty = Number(material.qty_terpasang) || 0
    const addedQty = Number(item.qty_terpasang) || 0
    return clampPercent(((currentQty + addedQty) / plannedQty) * 100)
  }

  const getRemainingQty = (material) => {
    if (!material) return 0
    return Math.max(0, (Number(material.qty_plan) || 0) - (Number(material.qty_terpasang) || 0))
  }

  const getPlanProgress = (plan) => {
    const filledItems = (plan.items || []).filter(item => item.material_id)
    if (filledItems.length === 0) return 0

    const total = filledItems.reduce((sum, item) => sum + getMaterialProgress(item), 0)
    return clampPercent(total / filledItems.length)
  }

  const calculatedPlanProgress = useMemo(() => {
    const filledPlans = form.plan_updates.filter(plan => String(plan.name || '').trim() !== '')
    if (filledPlans.length === 0) return 0

    const total = filledPlans.reduce((sum, plan) => sum + getPlanProgress(plan), 0)
    return clampPercent(total / filledPlans.length)
  }, [form.plan_updates, materials])

  const handlePlanChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      plan_updates: prev.plan_updates.map((plan, planIndex) => (
        planIndex === index ? { ...plan, [field]: value } : plan
      )),
    }))
  }

  const handlePlanItemChange = (planIndex, itemIndex, field, value) => {
    setForm(prev => ({
      ...prev,
      plan_updates: prev.plan_updates.map((plan, currentPlanIndex) => (
        currentPlanIndex === planIndex
          ? {
              ...plan,
              items: plan.items.map((item, currentItemIndex) => (
                currentItemIndex === itemIndex ? { ...item, [field]: value } : item
              )),
            }
          : plan
      )),
    }))
  }

  const addPlan = () => {
    setForm(prev => ({
      ...prev,
      plan_updates: [...prev.plan_updates, makeEmptyPlan()],
    }))
  }

  const removePlan = (index) => {
    setForm(prev => ({
      ...prev,
      plan_updates: prev.plan_updates.length === 1
        ? [makeEmptyPlan()]
        : prev.plan_updates.filter((_, planIndex) => planIndex !== index),
    }))
  }

  const addPlanItem = (planIndex) => {
    setForm(prev => ({
      ...prev,
      plan_updates: prev.plan_updates.map((plan, currentPlanIndex) => (
        currentPlanIndex === planIndex
          ? { ...plan, items: [...plan.items, makeEmptyItem()] }
          : plan
      )),
    }))
  }

  const removePlanItem = (planIndex, itemIndex) => {
    setForm(prev => ({
      ...prev,
      plan_updates: prev.plan_updates.map((plan, currentPlanIndex) => {
        if (currentPlanIndex !== planIndex) return plan

        return {
          ...plan,
          items: plan.items.length === 1
            ? [makeEmptyItem()]
            : plan.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
        }
      }),
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

  const handleAddMaterial = async (e) => {
    e.preventDefault()
    
    if (!newMaterial.name || !newMaterial.unit || !newMaterial.qty_plan) {
      toast.error('Nama, satuan, dan qty rencana wajib diisi')
      return
    }

    try {
      const response = await api.addMaterial({
        project_id: project.id,
        name: newMaterial.name.trim(),
        unit: newMaterial.unit.trim(),
        qty_plan: parseFloat(newMaterial.qty_plan),
        qty_terpasang: parseFloat(newMaterial.qty_terpasang) || 0
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
      } else {
        toast.error(response.message || 'Gagal menambahkan material')
      }
    } catch (error) {
      console.error('Failed to add material:', error)
      toast.error(error?.message || 'Gagal menambahkan material')
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      const plan_updates = form.plan_updates
        .filter(plan => plan.name?.trim())
        .map(plan => ({
          name: plan.name.trim(),
          progress_percentage: getPlanProgress(plan),
          items: (plan.items || [])
            .filter(item => item.material_id)
            .map(item => ({
              material_id: parseInt(item.material_id, 10),
              qty_terpasang: Number(item.qty_terpasang) || 0,
              catatan: item.catatan?.trim() || '',
            })),
        }))

      const invalidPlan = plan_updates.find(plan => plan.items.length === 0)
      if (invalidPlan) {
        toast.error(`Plan "${invalidPlan.name}" wajib punya minimal 1 barang`)
        return
      }

      const invalidQtyItem = plan_updates
        .flatMap(plan => plan.items.map(item => ({ ...item, plan_name: plan.name })))
        .find(item => Number(item.qty_terpasang) <= 0)
      if (invalidQtyItem) {
        toast.error(`Qty barang di plan "${invalidQtyItem.plan_name}" harus lebih dari 0`)
        return
      }

      const qtyByMaterial = plan_updates
        .flatMap(plan => plan.items)
        .reduce((acc, item) => {
          acc[item.material_id] = (acc[item.material_id] || 0) + (Number(item.qty_terpasang) || 0)
          return acc
        }, {})

      const overQtyMaterialId = Object.entries(qtyByMaterial).find(([materialId, qty]) => {
        const material = materialMap[String(materialId)]
        return material && qty > getRemainingQty(material)
      })?.[0]

      if (overQtyMaterialId) {
        const material = materialMap[String(overQtyMaterialId)]
        toast.error(`Qty ${material.name} melebihi sisa ${getRemainingQty(material)} ${material.unit}`)
        return
      }

      if (plan_updates.length === 0) {
        toast.error('Minimal isi 1 plan pekerjaan')
        return
      }

      if (!form.photo) {
        toast.error('Foto wajib diupload')
        return
      }

      const response = await api.submitProgressReport({
        project_id: project.id,
        progress_percentage: calculatedPlanProgress,
        notes: form.notes?.trim() || '',
        photo: form.photo,
        plan_updates,
      })

      if (response.success) {
        toast.success('Progress berhasil diupdate')
        onSaved?.(response.data)
        onClose?.()
      } else {
        toast.error(response.message || 'Gagal menyimpan progress')
      }
    } catch (error) {
      console.error('Failed to submit project progress:', error)
      toast.error(error?.message || 'Gagal menyimpan progress')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#de168c]">Update Progress Pemasangan</h3>
          <p className="text-sm text-gray-600">{project?.name}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Progress Percentage
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Otomatis dari barang yang dipasang di setiap plan.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#237043]">{calculatedPlanProgress}%</div>
                <div className="text-xs text-gray-500">total progress</div>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#237043] rounded-full transition-all"
                style={{ width: `${calculatedPlanProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Plan Pekerjaan
              </label>
              <button
                type="button"
                onClick={addPlan}
                className="inline-flex items-center gap-1 text-sm text-[#237043] hover:text-[#5a9844]"
                disabled={submitting}
              >
                <Plus size={14} />
                Tambah Plan
              </button>
            </div>

            <div className="space-y-3">
              {form.plan_updates.map((plan, planIndex) => {
                const planProgress = getPlanProgress(plan)

                return (
                  <div key={plan.id || planIndex} className="border border-gray-200 rounded-lg p-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nama Plan
                        </label>
                        <div className="relative">
                          <Target size={15} className="absolute left-3 top-3 text-gray-400" />
                          <textarea
                            value={plan.name}
                            onChange={(e) => handlePlanChange(planIndex, 'name', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c] resize-none"
                            placeholder={planIndex === 0 ? 'Contoh: Menarik kabel dari panel utama ke ruang server' : 'Contoh: Penempatan router dan konfigurasi jaringan'}
                            rows={2}
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removePlan(planIndex)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          disabled={submitting}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1">
                        <span>Progress Plan</span>
                        <span>{planProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${planProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-gray-600">
                          Barang Plan
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddMaterialModal(true)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            disabled={submitting || loadingMaterials}
                          >
                            <Plus size={13} />
                            Material Baru
                          </button>
                          <button
                            type="button"
                            onClick={() => addPlanItem(planIndex)}
                            className="inline-flex items-center gap-1 text-xs text-[#237043] hover:text-[#5a9844] font-medium"
                            disabled={submitting || loadingMaterials}
                          >
                            <Plus size={13} />
                            Tambah Barang
                          </button>
                        </div>
                      </div>

                      {loadingMaterials ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          Memuat daftar material...
                        </div>
                      ) : materials.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4">
                          <p className="text-sm text-gray-500 mb-3">Belum ada material proyek.</p>
                          <button
                            type="button"
                            onClick={() => setShowAddMaterialModal(true)}
                            className="flex items-center gap-1.5 text-sm text-[#237043] hover:text-[#5a9844] font-medium"
                          >
                            <Plus size={14} />
                            Tambah Material Baru
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {plan.items.map((item, itemIndex) => {
                            const selectedMaterial = materialMap[String(item.material_id)]
                            const remainingQty = selectedMaterial
                              ? getRemainingQty(selectedMaterial)
                              : 0
                            const itemProgress = getMaterialProgress(item)

                            return (
                              <div key={item.id || itemIndex} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.7fr_auto] gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Material</label>
                                    <select
                                      value={item.material_id}
                                      onChange={(e) => handlePlanItemChange(planIndex, itemIndex, 'material_id', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                                      disabled={submitting}
                                    >
                                      <option value="">Pilih material</option>
                                      {materials.map(material => (
                                        <option key={material.id} value={material.id}>
                                          {material.name} ({material.unit})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty Dipasang</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={remainingQty || undefined}
                                      step="0.01"
                                      value={item.qty_terpasang}
                                      onChange={(e) => handlePlanItemChange(planIndex, itemIndex, 'qty_terpasang', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                                      placeholder="0"
                                      disabled={submitting}
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => removePlanItem(planIndex, itemIndex)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                      disabled={submitting}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {selectedMaterial && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Package size={13} />
                                      <span>
                                        Terpasang {selectedMaterial.qty_terpasang} / {selectedMaterial.qty_plan} {selectedMaterial.unit},
                                        sisa {remainingQty} {selectedMaterial.unit}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-[#237043] rounded-full transition-all"
                                          style={{ width: `${itemProgress}%` }}
                                        />
                                      </div>
                                      <span className="w-9 text-right font-medium text-gray-700">{itemProgress}%</span>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Catatan Barang</label>
                                  <input
                                    type="text"
                                    value={item.catatan}
                                    onChange={(e) => handlePlanItemChange(planIndex, itemIndex, 'catatan', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                                    placeholder="Contoh: dipasang di lantai 2"
                                    disabled={submitting}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Progress
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Tambahkan catatan progress..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoCapture}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
              disabled={submitting}
              required
            />
            {form.photo && (
              <div className="mt-2">
                <img
                  src={form.photo}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-[#237043] hover:bg-[#5a9844]"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Progress'}
          </Button>
        </div>
      </div>

      {/* Modal: Tambah Material Baru */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#de168c]">Tambah Material Baru</h3>
            </div>
            <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Material <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                  placeholder="Contoh: Kabel UTP Cat6"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Satuan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                    placeholder="meter, pcs, dll"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qty Rencana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMaterial.qty_plan}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, qty_plan: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qty Awal Terpasang (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterial.qty_terpasang}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, qty_terpasang: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de168c] focus:border-[#de168c]"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMaterialModal(false)
                    setNewMaterial({ name: '', unit: '', qty_plan: '', qty_terpasang: '0' })
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-[#237043] text-white hover:bg-[#5a9844] rounded-lg font-medium"
                >
                  Tambah Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
