import { useState, useMemo } from 'react'
import { Plus, Search, CheckCircle, Clock, ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const INIT_PROJECTS = [
  { id: 1, name: 'RS Sentral Amsar', location: 'Jakarta Selatan', status: 'on_track', progress: 72, rab: 850, realisasi: 720, pm: 'Budi Santoso', deadline: '2026-09-30', completedAt: null },
  { id: 2, name: 'Klinik Utama Barat', location: 'Tangerang', status: 'at_risk', progress: 45, rab: 400, realisasi: 410, pm: 'Siti Rahayu', deadline: '2026-07-15', completedAt: null },
  { id: 3, name: 'Lab Medis Timur', location: 'Bekasi', status: 'on_track', progress: 88, rab: 300, realisasi: 280, pm: 'Ahmad Fauzi', deadline: '2026-06-10', completedAt: null },
  { id: 4, name: 'Apotek Cabang 3', location: 'Depok', status: 'delayed', progress: 30, rab: 200, realisasi: 195, pm: 'Dewi Lestari', deadline: '2026-05-01', completedAt: null },
  { id: 5, name: 'Puskesmas Cilandak', location: 'Jakarta Selatan', status: 'completed', progress: 100, rab: 150, realisasi: 148, pm: 'Rudi Hartono', deadline: '2025-12-31', completedAt: '2025-12-28' },
]

const statusMap = {
  on_track:  { label: 'On Track',  variant: 'success' },
  at_risk:   { label: 'At Risk',   variant: 'warning' },
  delayed:   { label: 'Delayed',   variant: 'danger' },
  completed: { label: 'Selesai',   variant: 'info' },
}

const STORAGE_KEY = 'projects_data'

const loadProjects = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : INIT_PROJECTS
  } catch {
    return INIT_PROJECTS
  }
}

const EMPTY_FORM = { name: '', location: '', pm: '', deadline: '', rab: '', status: 'on_track' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState(loadProjects)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLokasi, setFilterLokasi] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmId, setConfirmId] = useState(null)
  const [showHistory, setShowHistory] = useState(true)
  const navigate = useNavigate()

  const activeProjects = projects.filter(p => p.status !== 'completed')
  const completedProjects = projects.filter(p => p.status === 'completed')

  // derive unique lokasi & tahun dari data
  const lokasiOptions = useMemo(() => [...new Set(projects.map(p => p.location))].sort(), [projects])
  const tahunOptions = useMemo(() => [...new Set(projects.map(p => new Date(p.deadline).getFullYear()))].sort(), [projects])

  const bulanOptions = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' },
  ]

  const hasActiveFilter = filterStatus !== 'all' || filterLokasi || filterBulan || filterTahun

  const applyFilters = (list) => list.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.pm.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchLokasi = !filterLokasi || p.location === filterLokasi
    const deadline = new Date(p.deadline)
    const matchBulan = !filterBulan || String(deadline.getMonth() + 1) === filterBulan
    const matchTahun = !filterTahun || String(deadline.getFullYear()) === filterTahun
    return matchSearch && matchStatus && matchLokasi && matchBulan && matchTahun
  })

  const filtered = applyFilters(activeProjects)
  const filteredCompleted = applyFilters(completedProjects)

  const saveProjects = (updated) => {
    setProjects(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

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
      completedAt: null,
    }
    saveProjects([newProject, ...projects])
    toast.success('Proyek berhasil ditambahkan')
    setOpen(false)
    setForm(EMPTY_FORM)
  }

  const handleMarkComplete = (id) => {
    const updated = projects.map(p =>
      p.id === id
        ? { ...p, status: 'completed', progress: 100, completedAt: new Date().toISOString().split('T')[0] }
        : p
    )
    saveProjects(updated)
    toast.success('Proyek ditandai selesai')
    setConfirmId(null)
  }


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Proyek</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeProjects.length} proyek aktif · {completedProjects.length} selesai
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Proyek
        </button>
      </div>

      <div className="space-y-3">
        {/* Search + Toggle Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, lokasi, PM..."
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              hasActiveFilter
                ? 'bg-[#0f4c81] text-white border-[#0f4c81]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filter
            {hasActiveFilter && (
              <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                {[filterStatus !== 'all', filterLokasi, filterBulan, filterTahun].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilter && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterLokasi(''); setFilterBulan(''); setFilterTahun('') }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Status</label>
              <div className="flex flex-col gap-1">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'on_track', label: 'On Track' },
                  { key: 'at_risk', label: 'At Risk' },
                  { key: 'delayed', label: 'Delayed' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setFilterStatus(s.key)}
                    className={`text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      filterStatus === s.key ? 'bg-[#0f4c81] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lokasi */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Lokasi</label>
              <select
                value={filterLokasi}
                onChange={e => setFilterLokasi(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Lokasi</option>
                {lokasiOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Bulan Deadline */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Bulan Deadline</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Bulan</option>
                {bulanOptions.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
              </select>
            </div>

            {/* Tahun Deadline */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tahun Deadline</label>
              <select
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Tahun</option>
                {tahunOptions.map(t => <option key={t} value={String(t)}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilter && (
          <div className="flex flex-wrap gap-2">
            {filterStatus !== 'all' && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterStatus === 'on_track' ? 'On Track' : filterStatus === 'at_risk' ? 'At Risk' : 'Delayed'}
                <button onClick={() => setFilterStatus('all')}><X size={11} /></button>
              </span>
            )}
            {filterLokasi && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterLokasi}
                <button onClick={() => setFilterLokasi('')}><X size={11} /></button>
              </span>
            )}
            {filterBulan && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {bulanOptions.find(b => b.val === filterBulan)?.label}
                <button onClick={() => setFilterBulan('')}><X size={11} /></button>
              </span>
            )}
            {filterTahun && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterTahun}
                <button onClick={() => setFilterTahun('')}><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Active Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div
              className="cursor-pointer"
              onClick={() => navigate(`/projects/${p.id}`)}
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

            {/* Tandai Selesai Button */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              {confirmId === p.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex-1">Tandai proyek ini selesai?</span>
                  <button
                    onClick={() => handleMarkComplete(p.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Ya, Selesai
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmId(p.id) }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <CheckCircle size={13} /> Tandai Selesai
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 text-sm">
            Tidak ada proyek ditemukan
          </div>
        )}
      </div>

      {/* History Proyek Selesai */}
      {filteredCompleted.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                History Proyek Selesai
              </h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {filteredCompleted.length}
              </span>
            </div>
            {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {filteredCompleted.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location} · PM: {p.pm}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-green-600">100%</p>
                    <p className="text-xs text-gray-400">
                      Selesai {p.completedAt ? new Date(p.completedAt).toLocaleDateString('id-ID') : '-'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Rp {p.realisasi}jt</p>
                    <p className="text-xs text-gray-400">dari Rp {p.rab}jt</p>
                  </div>
                  <Badge variant="info">Selesai</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
