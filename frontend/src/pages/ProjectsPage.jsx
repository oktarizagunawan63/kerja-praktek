import { useState, useMemo } from 'react'
import { Plus, Search, CheckCircle, Clock, ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAppStore from '../store/appStore'
import { formatRupiah } from '../lib/formatRupiah'

const statusMap = {
  on_track:  { label: 'On Track',  variant: 'success' },
  at_risk:   { label: 'At Risk',   variant: 'warning' },
  delayed:   { label: 'Delayed',   variant: 'danger' },
  completed: { label: 'Selesai',   variant: 'info' },
}

const EMPTY_FORM = { name: '', location: '', pm: '', phone: '', deadline: '', rab: '', status: 'on_track' }

export default function ProjectsPage() {
  const { projects, addProject, deleteProject, markComplete } = useAppStore()
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLokasi, setFilterLokasi] = useState('')
  const [filterBulan, setFilterBulan]   = useState('')
  const [filterTahun, setFilterTahun]   = useState('')
  const [showFilter, setShowFilter]     = useState(false)
  const [open, setOpen]                 = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [confirmId, setConfirmId]       = useState(null)
  const [showHistory, setShowHistory]   = useState(true)
  const navigate = useNavigate()

  const active    = projects.filter(p => p.status !== 'completed')
  const completed = projects.filter(p => p.status === 'completed')

  const lokasiOptions = useMemo(() => [...new Set(projects.map(p => p.location))].sort(), [projects])
  const tahunOptions  = useMemo(() => [...new Set(projects.map(p => new Date(p.deadline).getFullYear()))].sort(), [projects])

  const bulanOptions = [
    { val:'1',label:'Januari' },{ val:'2',label:'Februari' },{ val:'3',label:'Maret' },
    { val:'4',label:'April' },{ val:'5',label:'Mei' },{ val:'6',label:'Juni' },
    { val:'7',label:'Juli' },{ val:'8',label:'Agustus' },{ val:'9',label:'September' },
    { val:'10',label:'Oktober' },{ val:'11',label:'November' },{ val:'12',label:'Desember' },
  ]

  const hasActiveFilter = filterStatus !== 'all' || filterLokasi || filterBulan || filterTahun

  const applyFilters = (list) => list.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.pm.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchLokasi = !filterLokasi || p.location === filterLokasi
    const dl = new Date(p.deadline)
    const matchBulan = !filterBulan || String(dl.getMonth() + 1) === filterBulan
    const matchTahun = !filterTahun || String(dl.getFullYear()) === filterTahun
    return matchSearch && matchStatus && matchLokasi && matchBulan && matchTahun
  })

  const filtered          = applyFilters(active)
  const filteredCompleted = applyFilters(completed)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.location || !form.pm || !form.deadline || !form.rab) {
      toast.error('Semua field wajib diisi'); return
    }
    addProject({ name: form.name, location: form.location, pm: form.pm, phone: form.phone, deadline: form.deadline, rab: parseFloat(String(form.rab).replace(/\./g, '')), status: form.status })
    toast.success('Proyek berhasil ditambahkan')
    setOpen(false); setForm(EMPTY_FORM)
  }

  const handleDelete = (id, name) => {
    deleteProject(id)
    toast.success(`Proyek "${name}" dihapus`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Proyek</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} proyek aktif · {completed.length} selesai</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Proyek
        </button>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, lokasi, PM..."
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${hasActiveFilter ? 'bg-[#0f4c81] text-white border-[#0f4c81]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={14} /> Filter
            {hasActiveFilter && <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">{[filterStatus!=='all',filterLokasi,filterBulan,filterTahun].filter(Boolean).length}</span>}
          </button>
          {hasActiveFilter && (
            <button onClick={() => { setFilterStatus('all'); setFilterLokasi(''); setFilterBulan(''); setFilterTahun('') }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><X size={13} /> Reset</button>
          )}
        </div>

        {showFilter && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Status</label>
              <div className="flex flex-col gap-1">
                {[{key:'all',label:'Semua'},{key:'on_track',label:'On Track'},{key:'at_risk',label:'At Risk'},{key:'delayed',label:'Delayed'}].map(s => (
                  <button key={s.key} onClick={() => setFilterStatus(s.key)}
                    className={`text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${filterStatus===s.key ? 'bg-[#0f4c81] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Lokasi</label>
              <select value={filterLokasi} onChange={e => setFilterLokasi(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">Semua Lokasi</option>
                {lokasiOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Bulan Deadline</label>
              <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">Semua Bulan</option>
                {bulanOptions.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tahun Deadline</label>
              <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">Semua Tahun</option>
                {tahunOptions.map(t => <option key={t} value={String(t)}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Active Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>
                </div>
                <Badge variant={statusMap[p.status]?.variant || 'default'}>{statusMap[p.status]?.label || p.status}</Badge>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span className="font-semibold text-gray-700">{p.progress || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400">RAB</p>
                  <p className="font-semibold text-gray-700">{formatRupiah(p.rab)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400">RAB Terealisasi</p>
                  <p className={`font-semibold ${p.realisasi > p.rab ? 'text-red-500' : 'text-gray-700'}`}>{formatRupiah(p.realisasi || 0)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                <span>PM: {p.pm}</span>
                <span>Deadline: {new Date(p.deadline).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              {confirmId === p.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex-1">Tandai proyek ini selesai?</span>
                  <button onClick={() => { markComplete(p.id); setConfirmId(null); toast.success('Proyek selesai') }}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Ya, Selesai</button>
                  <button onClick={() => setConfirmId(null)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">Batal</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setConfirmId(p.id) }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 py-1.5 rounded-lg font-medium">
                    <CheckCircle size={13} /> Tandai Selesai
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name) }}
                    className="flex items-center justify-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 text-sm">Tidak ada proyek ditemukan</div>
        )}
      </div>

      {/* History Selesai */}
      {filteredCompleted.length > 0 && (
        <div className="card">
          <button onClick={() => setShowHistory(v => !v)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">History Proyek Selesai</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filteredCompleted.length}</span>
            </div>
            {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {showHistory && (
            <div className="mt-4 space-y-3">
              {filteredCompleted.map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location} · PM: {p.pm}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-green-600">100%</p>
                    <p className="text-xs text-gray-400">Selesai {p.completedAt ? new Date(p.completedAt).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{formatRupiah(p.realisasi || 0)}</p>
                    <p className="text-xs text-gray-400">dari {formatRupiah(p.rab)}</p>
                  </div>
                  <Badge variant="info">Selesai</Badge>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name) }}
                    className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Hapus</button>
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
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nama proyek..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Lokasi</label>
            <input type="text" required value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Kota / lokasi..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Project Manager</label>
              <input type="text" required value={form.pm} onChange={e => setForm({...form, pm: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nama PM..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Email PM</label>
              <input type="email" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="pm@ptamsar.co.id" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Deadline</label>
              <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">RAB</label>
            <input
              type="text"
              required
              value={form.rab}
              onChange={e => {
                // Strip semua non-digit, lalu format dengan titik ribuan
                const raw = e.target.value.replace(/\D/g, '')
                const formatted = raw ? parseInt(raw).toLocaleString('id-ID') : ''
                setForm({...form, rab: formatted})
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: 7.500.000"
            />
            {form.rab && (() => {
              const num = parseInt(form.rab.replace(/\./g, ''))
              return !isNaN(num) && num > 0
                ? <p className="text-xs text-blue-600 mt-1">{formatRupiah(num)}</p>
                : null
            })()}
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
