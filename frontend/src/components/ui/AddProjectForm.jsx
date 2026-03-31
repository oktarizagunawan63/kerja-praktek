import { useState } from 'react'
import Modal from './Modal'
import toast from 'react-hot-toast'

const EMPTY = { name: '', location: '', sm: '', email: '', deadline: '', rab: '', status: 'on_track' }

const addActivityLog = (action, detail, project) => {
  const auth = JSON.parse(localStorage.getItem('amsar-auth') || '{}')
  const user = auth?.state?.user
  const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]')
  logs.unshift({
    id: Date.now(),
    user: user?.name || 'Unknown',
    role: user?.role || '-',
    action, detail, project,
    time: new Date().toLocaleString('id-ID'),
  })
  localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 50)))
}

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
    addActivityLog('Proyek Dibuat', `Proyek baru "${form.name}" di ${form.location} — SM: ${form.sm}`, form.name)
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
          <input type="text" required {...f('location')} className={cls} placeholder="Kota / lokasi proyek..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Site Manager (SM)</label>
            <input type="text" required {...f('sm')} className={cls} placeholder="Nama Site Manager..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email Site Manager</label>
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
