import { useState } from 'react'
import Modal from './Modal'
import LocationSelect from './LocationSelect'
import toast from 'react-hot-toast'

const EMPTY = { name: '', location: '', sm: '', email: '', deadline: '', rab: '', status: 'on_track' }

export default function AddProjectForm({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY)

  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) })
  const cls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.location || !form.sm || !form.deadline || !form.rab) {
      toast.error('Semua field wajib diisi')
      return
    }
    onSave({
      id: Date.now(),
      name: form.name,
      location: form.location,
      pm: form.sm,
      email: form.email || '',
      deadline: form.deadline,
      rab: parseFloat(form.rab),
      realisasi: 0,
      progress: 0,
      status: form.status,
      completedAt: null,
    })
    setForm(EMPTY)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Proyek Baru" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Nama Proyek</label>
          <input type="text" required {...f('name')} className={cls} placeholder="Nama proyek..." />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Lokasi</label>
          <LocationSelect
            value={form.location}
            onChange={(location) => setForm(p => ({ ...p, location }))}
            placeholder="Pilih lokasi proyek..."
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Sales Manager (SM)</label>
            <input type="text" required {...f('sm')} className={cls} placeholder="Nama Sales Manager..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email Sales Manager</label>
            <input type="email" {...f('email')} className={cls} placeholder="nama@email.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
            <select {...f('status')} className={cls}>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">RAB (juta Rp)</label>
            <input type="number" min="1" required {...f('rab')} className={cls} placeholder="Contoh: 500" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Deadline</label>
          <input type="date" required {...f('deadline')} className={cls} />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" className="btn-primary">Simpan Proyek</button>
        </div>
      </form>
    </Modal>
  )
}
