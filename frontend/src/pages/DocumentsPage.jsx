import { useState, useMemo, useEffect } from 'react'
import { FileText, Image, Download, Eye, Plus, Trash2, X, Search, SlidersHorizontal, History, ChevronDown, ChevronUp } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'
import { fileToBase64, downloadFile } from '../lib/fileUtils'

const addActivityLog = (action, detail, project = '-') => {
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

const INIT_DOCS = [
  { id: 1, name: 'Laporan Harian 22 Mar 2026', project: 'RS Sentral Amsar', type: 'Laporan Harian', uploader: 'Budi S.', date: '22 Mar 2026', size: '1.2 MB', previewUrl: null, fileType: 'pdf' },
  { id: 2, name: 'Foto Pekerjaan Lantai 3', project: 'RS Sentral Amsar', type: 'Foto', uploader: 'Ahmad F.', date: '21 Mar 2026', size: '4.5 MB', previewUrl: null, fileType: 'image' },
  { id: 3, name: 'Laporan Mingguan W12', project: 'Klinik Utama Barat', type: 'Laporan Mingguan', uploader: 'Siti R.', date: '20 Mar 2026', size: '2.1 MB', previewUrl: null, fileType: 'pdf' },
  { id: 4, name: 'Dokumen Teknis MEP', project: 'Lab Medis Timur', type: 'Dokumen Teknis', uploader: 'Dewi L.', date: '19 Mar 2026', size: '3.8 MB', previewUrl: null, fileType: 'pdf' },
]

const typeVariant = {
  'Laporan Harian': 'info', 'Laporan Mingguan': 'success',
  'Foto': 'warning', 'Dokumen Teknis': 'default',
}

const loadAllDocs = () => {
  try {
    // Baca dari semua proyek di appStore
    const appData = JSON.parse(localStorage.getItem('amsar-app') || '{}')
    const projects = appData?.state?.projects || []

    // Dokumen dari ProjectDetailPage (pdocs_${id})
    const projectDocs = []
    projects.forEach(p => {
      const saved = JSON.parse(localStorage.getItem(`pdocs_${p.id}`) || '[]')
      saved.forEach(d => projectDocs.push({ ...d, projectName: p.name }))
    })

    // Dokumen dari halaman Dokumen sendiri
    const globalDocs = JSON.parse(localStorage.getItem('global_docs') || '[]')

    // Gabung, hilangkan duplikat
    const all = [...globalDocs, ...projectDocs]
    const seen = new Set()
    return all.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true })
  } catch { return [] }
}

const saveGlobalDocs = (docs) => {
  // Hanya simpan dokumen yang diupload dari halaman Dokumen (bukan dari ProjectDetail)
  const serializable = docs.filter(d => d.fromGlobal).map(d => ({ ...d, previewUrl: null }))
  localStorage.setItem('global_docs', JSON.stringify(serializable))
}

  const loadProjects = () => {
    try {
      const appData = JSON.parse(localStorage.getItem('amsar-app') || '{}')
      const projects = appData?.state?.projects || []
      return projects.length ? projects.map(p => p.name) : ['RS Sentral Amsar', 'Klinik Utama Barat', 'Lab Medis Timur']
    } catch { return [] }
  }

export default function DocumentsPage() {
  const [docs, setDocs] = useState(() => loadAllDocs())

  // Refresh dari localStorage setiap kali halaman aktif
  useEffect(() => {
    setDocs(loadAllDocs())
  }, [])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ project: '', type: 'Laporan Harian', files: [] })
  const [preview, setPreview] = useState(null)
  const [historyDoc, setHistoryDoc] = useState(null) // doc yang sedang dilihat riwayatnya
  const [expandedRevisions, setExpandedRevisions] = useState({}) // { docId: bool }
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterProject, setFilterProject] = useState('')
  const [filterUploader, setFilterUploader] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const projects = loadProjects()

  const uploaderOptions = useMemo(() => [...new Set(docs.map(d => d.uploader))].sort(), [docs])
  const tahunOptions = useMemo(() => {
    const years = docs.map(d => {
      const parts = d.date.split(' ')
      return parts[parts.length - 1]
    })
    return [...new Set(years)].sort().reverse()
  }, [docs])

  const bulanOptions = [
    { val: 'Jan', label: 'Januari' }, { val: 'Feb', label: 'Februari' }, { val: 'Mar', label: 'Maret' },
    { val: 'Apr', label: 'April' }, { val: 'Mei', label: 'Mei' }, { val: 'Jun', label: 'Juni' },
    { val: 'Jul', label: 'Juli' }, { val: 'Agu', label: 'Agustus' }, { val: 'Sep', label: 'September' },
    { val: 'Okt', label: 'Oktober' }, { val: 'Nov', label: 'November' }, { val: 'Des', label: 'Desember' },
  ]

  const hasActiveFilter = filterType !== 'all' || filterProject || filterUploader || filterBulan || filterTahun

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase()) ||
      d.uploader.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || d.type === filterType
    const matchProject = !filterProject || d.project === filterProject
    const matchUploader = !filterUploader || d.uploader === filterUploader
    const matchBulan = !filterBulan || d.date.includes(filterBulan)
    const matchTahun = !filterTahun || d.date.endsWith(filterTahun)
    return matchSearch && matchType && matchProject && matchUploader && matchBulan && matchTahun
  })

  const resetFilters = () => {
    setFilterType('all'); setFilterProject(''); setFilterUploader(''); setFilterBulan(''); setFilterTahun('')
  }

  const handleSubmit = async () => {
    if (form.files.length === 0) { toast.error('Pilih file terlebih dahulu'); return }
    const file = form.files[0]
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    const resolvedType = isImage ? 'Foto' : form.type
    const selectedProject = form.project || projects[0]
    const base64 = await fileToBase64(file)

    const existing = docs.find(d =>
      d.project === selectedProject &&
      d.type === resolvedType &&
      !d.isRevision
    )

    const newDoc = {
      id: Date.now(),
      name: file.name,
      project: selectedProject,
      type: resolvedType,
      uploader: 'Budi S.',
      date: new Date().toLocaleDateString('id-ID'),
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      previewUrl: base64,
      fileType: isImage ? 'image' : isPdf ? 'pdf' : 'other',
      fileName: file.name,
      revisions: [],
      version: 1,
      isRevision: false,
      fromGlobal: true,
    }

    if (existing && form.asRevision) {
      // Tambah sebagai revisi ke dokumen yang ada
      const revEntry = {
        id: Date.now(),
        name: file.name,
        uploader: 'Budi S.',
        date: new Date().toLocaleDateString('id-ID'),
        size: newDoc.size,
        previewUrl: newDoc.previewUrl,
        fileType: newDoc.fileType,
        fileName: file.name,
        version: (existing.revisions?.length || 0) + 2,
        note: form.revisionNote || '',
      }
      const updated = docs.map(d =>
        d.id === existing.id
          ? { ...d, revisions: [revEntry, ...(d.revisions || [])], version: revEntry.version, name: file.name, previewUrl: newDoc.previewUrl, fileType: newDoc.fileType, date: newDoc.date, size: newDoc.size }
          : d
      )
      setDocs(updated)
      saveGlobalDocs(updated)
      addActivityLog('Revisi Dokumen', `Revisi v${revEntry.version}: ${file.name} — Proyek: ${selectedProject}`)
      toast.success(`Revisi v${revEntry.version} berhasil disimpan`)
    } else {
      const withFlag = { ...newDoc, fromGlobal: true }
      const updated = [withFlag, ...docs]
      setDocs(updated)
      saveGlobalDocs(updated)
      addActivityLog('Upload Dokumen', `Upload ${resolvedType}: ${newDoc.name} — Proyek: ${selectedProject}`)
      toast.success('Dokumen berhasil ditambahkan')
    }

    setOpen(false)
    setForm({ project: projects[0], type: 'Laporan Harian', files: [], asRevision: false, revisionNote: '' })
  }

  // Cek kandidat revisi saat form berubah
  const revisionCandidate = useMemo(() => {
    if (!form.files?.length) return null
    const file = form.files[0]
    const isImage = file.type.startsWith('image/')
    const resolvedType = isImage ? 'Foto' : form.type
    const selectedProject = form.project || projects[0]
    return docs.find(d => d.project === selectedProject && d.type === resolvedType && !d.isRevision) || null
  }, [form.files, form.type, form.project, docs])

  const handlePreview = (doc) => {
    if (!doc.previewUrl) {
      toast('File ini tidak bisa dipreview', { icon: 'ℹ️' })
      return
    }
    if (doc.fileType === 'pdf') {
      // Buka PDF di tab baru
      const win = window.open()
      win.document.write(`<iframe src="${doc.previewUrl}" style="width:100%;height:100vh;border:none"></iframe>`)
    } else {
      setPreview(doc)
    }
  }

  const handleDownload = (doc) => {
    if (!doc.previewUrl) {
      toast('File ini tidak bisa didownload', { icon: 'ℹ️' })
      return
    }
    downloadFile(doc.previewUrl, doc.fileName || doc.name)
    toast.success('Download dimulai')
  }

  const handleDelete = (id, name) => {
    const updated = docs.filter(d => d.id !== id)
    setDocs(updated)
    saveGlobalDocs(updated)
    addActivityLog('Hapus Dokumen', `Hapus dokumen: ${name}`)
    toast.success('Dokumen dihapus')
  }


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dokumen Proyek</h1>
          <p className="text-sm text-gray-500 mt-0.5">{docs.length} dokumen tersimpan</p>
        </div>
        <button onClick={() => { setForm({ project: projects[0], type: 'Laporan Harian', files: [] }); setOpen(true) }}
          className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Tambah Dokumen
        </button>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama file, proyek, uploader..."
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              hasActiveFilter ? 'bg-[#0f4c81] text-white border-[#0f4c81]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filter
            {hasActiveFilter && (
              <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                {[filterType !== 'all', filterProject, filterUploader, filterBulan, filterTahun].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilter && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {showFilter && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Tipe */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tipe Dokumen</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Semua Tipe</option>
                {['Laporan Harian','Laporan Mingguan','Foto','Dokumen Teknis','Berita Acara'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {/* Proyek */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Proyek</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Semua Proyek</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Uploader */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Uploader</label>
              <select value={filterUploader} onChange={e => setFilterUploader(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Semua Uploader</option>
                {uploaderOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {/* Bulan & Tahun */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Bulan</label>
                <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Semua Bulan</option>
                  {bulanOptions.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Tahun</label>
                <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Semua Tahun</option>
                  {tahunOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active chips */}
        {hasActiveFilter && (
          <div className="flex flex-wrap gap-2">
            {filterType !== 'all' && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterType} <button onClick={() => setFilterType('all')}><X size={11} /></button>
              </span>
            )}
            {filterProject && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterProject} <button onClick={() => setFilterProject('')}><X size={11} /></button>
              </span>
            )}
            {filterUploader && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterUploader} <button onClick={() => setFilterUploader('')}><X size={11} /></button>
              </span>
            )}
            {filterBulan && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {bulanOptions.find(b => b.val === filterBulan)?.label} <button onClick={() => setFilterBulan('')}><X size={11} /></button>
              </span>
            )}
            {filterTahun && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {filterTahun} <button onClick={() => setFilterTahun('')}><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Nama File', 'Proyek', 'Tipe', 'Diupload Oleh', 'Tanggal', 'Ver.', 'Aksi'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <>
                <tr key={doc.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {doc.fileType === 'image' && doc.previewUrl
                        ? <img src={doc.previewUrl} alt={doc.name} className="w-8 h-8 rounded object-cover shrink-0" />
                        : doc.type === 'Foto'
                          ? <Image size={16} className="text-yellow-500 shrink-0" />
                          : <FileText size={16} className="text-blue-500 shrink-0" />
                      }
                      <span className="font-medium text-gray-800 truncate max-w-[160px]">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{doc.project}</td>
                  <td className="px-4 py-3"><Badge variant={typeVariant[doc.type] || 'default'}>{doc.type}</Badge></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{doc.uploader}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{doc.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-500">v{doc.version || 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePreview(doc)} title="Preview"
                        className={`p-1.5 rounded transition-colors ${doc.previewUrl ? 'hover:bg-blue-50 text-gray-500 hover:text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}>
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDownload(doc)} title="Download"
                        className={`p-1.5 rounded transition-colors ${doc.previewUrl ? 'hover:bg-green-50 text-gray-500 hover:text-green-600' : 'text-gray-300 cursor-not-allowed'}`}>
                        <Download size={14} />
                      </button>
                      {doc.revisions?.length > 0 && (
                        <button
                          onClick={() => setExpandedRevisions(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                          title="Riwayat Revisi"
                          className="p-1.5 hover:bg-purple-50 rounded text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          <History size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(doc.id, doc.name)} title="Hapus"
                        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Revision history rows */}
                {expandedRevisions[doc.id] && doc.revisions?.length > 0 && (
                  <tr key={`rev_${doc.id}`} className="bg-purple-50/50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                          <History size={12} /> Riwayat Revisi ({doc.revisions.length})
                        </p>
                        {doc.revisions.map(rev => (
                          <div key={rev.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-purple-100">
                            <span className="text-xs font-bold text-purple-600 shrink-0">v{rev.version}</span>
                            <FileText size={13} className="text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-700 flex-1 truncate">{rev.name}</span>
                            {rev.note && <span className="text-xs text-gray-400 italic truncate max-w-[120px]">{rev.note}</span>}
                            <span className="text-xs text-gray-400 shrink-0">{rev.uploader} · {rev.date}</span>
                            <span className="text-xs text-gray-400 shrink-0">{rev.size}</span>
                            <button onClick={() => rev.previewUrl && handlePreview(rev)}
                              className={`p-1 rounded ${rev.previewUrl ? 'hover:bg-blue-50 text-gray-400 hover:text-blue-600' : 'text-gray-200 cursor-not-allowed'}`}>
                              <Eye size={12} />
                            </button>
                            <button onClick={() => rev.previewUrl && handleDownload(rev)}
                              className={`p-1 rounded ${rev.previewUrl ? 'hover:bg-green-50 text-gray-400 hover:text-green-600' : 'text-gray-200 cursor-not-allowed'}`}>
                              <Download size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Tidak ada dokumen ditemukan</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Photo Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={preview.previewUrl} alt={preview.name} className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="mt-3 text-center">
              <p className="text-white font-medium text-sm">{preview.name}</p>
              <p className="text-white/60 text-xs mt-0.5">{preview.project} · {preview.uploader} · {preview.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Dokumen" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Proyek</label>
              <select value={form.project || projects[0]} onChange={e => setForm({ ...form, project: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                {projects.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Jenis Dokumen</label>
              <input type="text" list="doc-types" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Pilih atau ketik..." />
              <datalist id="doc-types">
                {['Laporan Harian','Laporan Mingguan','Foto','Dokumen Teknis','Berita Acara','Surat Perintah Kerja','As Built Drawing'].map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>
          <FileUpload
            key={open ? 'open' : 'closed'}
            label="Upload File (PDF / Gambar)"
            accept={{ 'image/*': [], 'application/pdf': [] }}
            maxFiles={1}
            onFilesChange={files => setForm(f => ({ ...f, files }))}
          />

          {/* Revisi banner — muncul kalau ada kandidat */}
          {revisionCandidate && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <History size={15} className="text-purple-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-800">Dokumen serupa ditemukan</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    "{revisionCandidate.name}" (v{revisionCandidate.version || 1}) sudah ada di proyek ini.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.asRevision}
                  onChange={e => setForm(f => ({ ...f, asRevision: e.target.checked }))}
                  className="rounded" />
                <span className="text-xs text-purple-700 font-medium">Simpan sebagai revisi (bukan file baru)</span>
              </label>
              {form.asRevision && (
                <input type="text" value={form.revisionNote || ''}
                  onChange={e => setForm(f => ({ ...f, revisionNote: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Catatan revisi (opsional)..." />
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSubmit} className="btn-primary">
              {form.asRevision ? 'Simpan Revisi' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
