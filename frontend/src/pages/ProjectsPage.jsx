import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const INIT_PROJECTS = [
  { id: 1, name: 'RS Sentral Amsar', location: 'Jakarta Selatan', status: 'on_track', progress: 72, rab: 850, realisasi: 720, pm: 'Budi Santoso', deadline: '2026-09-30' },
  { id: 2, name: 'Klinik Utama Barat', location: 'Tangerang', status: 'at_risk', progress: 45, rab: 400, realisasi: 410, pm: 'Siti Rahayu', deadline: '2026-07-15' },
  { id: 3, name: 'Lab Medis Timur', location: 'Bekasi', status: 'on_track', progress: 88, rab: 300, realisasi: 280, pm: 'Ahmad Fauzi', deadline: '2026-06-10' },
  { id: 4, name: 'Apotek Cabang 3', location: 'Depok', status: 'delayed', progress: 30, rab: 200, realisasi: 195, pm: 'Dewi Lestari', deadline: '2026-05-01' },
]

const statusMap = {
  on_track: { label: 'On Track', variant: 'success' },
  at_risk:  { label: 'At Risk',  variant: 'warning' },
  delayed:  { label: 'Delayed',  variant: 'danger' },
}

const EMPTY_FORM = { name: '', location: '', pm: '', deadline: '', rab: '', status: 'on_track' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState(INIT_PROJECTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const navigate = useNavigate()

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.location || !form.pm || !form.deadline || !form.rab) {
      toast.error('Semua field wajib diisi')
      return
    }
    const newProject = {
      id: Date.now(),
      name: form.name,
      location: form.location,
      pm: form.pm,
      deadline: form.deadline,
      rab: parseFloat(form.rab),
      realisasi: 0,
      progress: 0,
      status: form.status,
    }
    setProjects(prev => [newProject, ...prev])
    toast.success('Proyek berhasil ditambahkan')
    setOpen(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Proyek</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} proyek aktif</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Proyek
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari proyek..."
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'on_track', 'at_risk', 'delayed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                filter === s ? 'bg-[#0f4c81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Semua' : statusMap[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            className="card cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>
              </div>
              <Badge variant={statusMap[p.status].variant}>{statusMap[p.status].label}</Badge>
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-semibold text-gray-700">{p.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">RAB</p>
                <p className="font-semibold text-gray-700">Rp {p.rab}jt</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">RAB Terealisasi</p>
                <p className={`font-semibold ${p.realisasi > p.rab ? 'text-red-500' : 'text-gray-700'}`}>
                  Rp {p.realisasi}jt
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-400">
              <span>PM: {p.pm}</span>
              <span>Deadline: {new Date(p.deadline).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Proyek */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Proyek Baru" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nama Proyek</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nama proyek..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Lokasi</label>
            <input
              type="text" required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Kota / lokasi proyek..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Project Manager</label>
              <input
                type="text" required
                value={form.pm}
                onChange={(e) => setForm({ ...form, pm: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nama PM..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">RAB (juta Rp)</label>
              <input
                type="number" min="1" required
                value={form.rab}
                onChange={(e) => setForm({ ...form, rab: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: 500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Deadline</label>
              <input
                type="date" required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Proyek</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
