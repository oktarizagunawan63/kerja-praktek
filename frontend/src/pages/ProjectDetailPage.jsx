import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Plus, FileText, Image, Trash2, CheckCircle, Clock, AlertTriangle, X, ZoomIn } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'

const addActivityLog = (action, detail, project = 'RS Sentral Amsar') => {
  const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]')
  logs.unshift({
    id: Date.now(),
    user: 'Budi Santoso',
    role: 'Project Manager',
    action,
    detail,
    project,
    time: new Date().toLocaleString('id-ID'),
  })
  localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 50)))
}

const MOCK_MATERIALS = [
  { id: 1, name: 'Beton K-300', unit: 'm3', qty_plan: 500, qty_terpasang: 350 },
  { id: 2, name: 'Besi Tulangan', unit: 'ton', qty_plan: 80, qty_terpasang: 60 },
  { id: 3, name: 'Kabel Listrik', unit: 'm', qty_plan: 2000, qty_terpasang: 1200 },
  { id: 4, name: 'Pipa PVC', unit: 'btg', qty_plan: 300, qty_terpasang: 180 },
]

const MOCK_DOCS = [
  { id: 1, name: 'Laporan Harian 22 Mar', type: 'Laporan Harian', uploader: 'Budi S.', date: '22 Mar 2026', previewUrl: null },
  { id: 2, name: 'Foto Pekerjaan Lantai 3', type: 'Foto', uploader: 'Ahmad F.', date: '21 Mar 2026', previewUrl: null },
]

const INIT_HISTORY = [
  { id: 1, action: 'Update Material Terpasang', detail: 'Tambah 50 m3 Beton K-300 — Pekerjaan lantai 2', user: 'Budi Santoso', time: '22 Mar 2026, 14:30', type: 'material' },
  { id: 2, action: 'Upload Dokumen', detail: 'Upload Laporan Harian: Laporan Harian 22 Mar', user: 'Budi Santoso', time: '22 Mar 2026, 09:15', type: 'dokumen' },
  { id: 3, action: 'Update Material Terpasang', detail: 'Tambah 10 ton Besi Tulangan — Struktur kolom', user: 'Ahmad Fauzi', time: '21 Mar 2026, 16:00', type: 'material' },
  { id: 4, action: 'Upload Dokumen', detail: 'Upload Foto: Foto Pekerjaan Lantai 3', user: 'Ahmad Fauzi', time: '21 Mar 2026, 11:45', type: 'dokumen' },
  { id: 5, action: 'Proyek Dibuat', detail: 'Proyek RS Sentral Amsar berhasil dibuat', user: 'Admin', time: '01 Jan 2026, 08:00', type: 'system' },
]

const historyIcon = {
  material: <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center"><Plus size={13} className="text-blue-600" /></div>,
  dokumen:  <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center"><FileText size={13} className="text-yellow-600" /></div>,
  system:   <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"><Clock size={13} className="text-gray-500" /></div>,
  selesai:  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle size={13} className="text-green-600" /></div>,
}

const loadProject = (id) => {
  try {
    const all = JSON.parse(localStorage.getItem('projects_data') || '[]')
    return all.find(p => String(p.id) === String(id)) || null
  } catch { return null }
}

const saveProjectField = (id, fields) => {
  try {
    const all = JSON.parse(localStorage.getItem('projects_data') || '[]')
    const updated = all.map(p => String(p.id) === String(id) ? { ...p, ...fields } : p)
    localStorage.setItem('projects_data', JSON.stringify(updated))
  } catch {}
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const project = loadProject(id)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [materialOpen, setMaterialOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [materials, setMaterials] = useState(project ? MOCK_MATERIALS : [])
  const [docs, setDocs] = useState(MOCK_DOCS)
  const [history, setHistory] = useState(INIT_HISTORY)
  const [isCompleted, setIsCompleted] = useState(project?.status === 'completed')
  const [completeNote, setCompleteNote] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [docTab, setDocTab] = useState('semua')

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-semibold">Proyek tidak ditemukan</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-sm text-[#0f4c81] hover:underline">
          Kembali ke Daftar Proyek
        </button>
      </div>
    )
  }

  const [matForm, setMatForm] = useState({ qty_tambah: '', catatan: '', files: [] })
  const [docForm, setDocForm] = useState({ type: 'Laporan Harian', files: [] })

  const addHistory = (entry) => {
    setHistory(prev => [{ id: Date.now(), ...entry, time: new Date().toLocaleString('id-ID') }, ...prev])
  }

  const handleMaterialSubmit = (e) => {
    e.preventDefault()
    if (!matForm.qty_tambah || matForm.files.length === 0) {
      toast.error('Isi qty dan upload dokumen perintah')
      return
    }
    const qty = parseFloat(matForm.qty_tambah)
    setMaterials(prev => prev.map(m =>
      m.id === selectedMaterial.id
        ? { ...m, qty_terpasang: Math.min(m.qty_terpasang + qty, m.qty_plan) }
        : m
    ))
    const detail = `Tambah ${qty} ${selectedMaterial.unit} untuk ${selectedMaterial.name}${matForm.catatan ? ' — ' + matForm.catatan : ''}`
    addActivityLog('Update Material Terpasang', detail)
    addHistory({ action: 'Update Material Terpasang', detail, user: 'Budi Santoso', type: 'material' })
    toast.success('Material terpasang berhasil diupdate')
    setMaterialOpen(false)
    setMatForm({ qty_tambah: '', catatan: '', files: [] })
  }

  const handleDocUpload = () => {
    if (docForm.files.length === 0) {
      toast.error('Pilih file terlebih dahulu')
      return
    }
    const file = docForm.files[0]
    const isImage = file.type.startsWith('image/')
    // auto-upgrade type ke Foto kalau file-nya gambar
    const resolvedType = isImage ? 'Foto' : docForm.type
    const newDoc = {
      id: Date.now(),
      name: file.name,
      type: resolvedType,
      uploader: project.pm.split(' ')[0] + ' S.',
      date: new Date().toLocaleDateString('id-ID'),
      previewUrl: isImage ? URL.createObjectURL(file) : null,
    }
    setDocs(prev => [newDoc, ...prev])
    const detail = `Upload ${docForm.type}: ${newDoc.name}`
    addActivityLog('Upload Dokumen', detail, project.name)
    addHistory({ action: 'Upload Dokumen', detail, user: project.pm, type: 'dokumen' })
    toast.success('Dokumen berhasil diupload')
    setUploadOpen(false)
    setDocForm({ type: 'Laporan Harian', files: [] })
  }

  const handleMarkComplete = () => {
    setIsCompleted(true)
    const detail = `Proyek dinyatakan selesai${completeNote ? ' — ' + completeNote : ''}`
    addActivityLog('Proyek Selesai', detail, project.name)
    addHistory({ action: 'Proyek Selesai', detail, user: project.pm, type: 'selesai' })
    saveProjectField(id, { status: 'completed', progress: 100, completedAt: new Date().toISOString().split('T')[0] })
    toast.success('Proyek berhasil ditandai selesai')
    setCompleteOpen(false)
    setCompleteNote('')
  }

  const openMaterialModal = (mat) => {
    setSelectedMaterial(mat)
    setMatForm({ qty_tambah: '', catatan: '', files: [] })
    setMaterialOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.location} · PM: {project.pm}</p>
        </div>
        {isCompleted
          ? <Badge variant="info">Selesai</Badge>
          : <Badge variant={project.status === 'at_risk' ? 'warning' : project.status === 'delayed' ? 'danger' : 'success'}>
              {project.status === 'at_risk' ? 'At Risk' : project.status === 'delayed' ? 'Delayed' : 'On Track'}
            </Badge>
        }
        {!isCompleted && (
          <button
            onClick={() => setCompleteOpen(true)}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <CheckCircle size={15} /> Tandai Selesai
          </button>
        )}
        {!isCompleted && (
          <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2">
            <Upload size={15} /> Upload Dokumen
          </button>
        )}
      </div>

      {/* Completed Banner */}
      {isCompleted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Proyek Telah Selesai</p>
            <p className="text-xs text-green-600">Ditandai selesai pada {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Progress', value: isCompleted ? '100%' : `${project.progress}%`, sub: isCompleted ? 'Selesai' : 'Update berkala' },
          { label: 'RAB Terealisasi', value: `Rp ${project.realisasi}jt`, sub: `RAB: Rp ${project.rab}jt` },
          { label: 'Teknisi PT Amsar', value: '24 Orang', sub: 'Aktif hari ini' },
          { label: 'Sisa Waktu', value: isCompleted ? '—' : `${Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / 86400000))} Hari`, sub: `Deadline: ${new Date(project.deadline).toLocaleDateString('id-ID')}` },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Material Terpasang */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Material Terpasang</h3>
        <div className="space-y-3">
          {materials.map((mat) => {
            const pct = Math.round((mat.qty_terpasang / mat.qty_plan) * 100)
            const isOver = mat.qty_terpasang >= mat.qty_plan
            return (
              <div key={mat.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mat.name}</p>
                    <p className="text-xs text-gray-400">
                      Terpasang: {mat.qty_terpasang} / {mat.qty_plan} {mat.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isOver ? 'text-green-600' : 'text-gray-600'}`}>
                      {pct}%
                    </span>
                    {!isCompleted && (
                      <button
                        onClick={() => openMaterialModal(mat)}
                        className="flex items-center gap-1 text-xs bg-[#0f4c81] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#1a6bb5] transition-colors"
                      >
                        <Plus size={12} /> Tambah
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dokumen Proyek */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-700">Dokumen Proyek</h3>
            <div className="flex gap-1">
              {['semua', 'foto', 'laporan'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setDocTab(tab)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    docTab === tab ? 'bg-[#0f4c81] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'semua' ? 'Semua' : tab === 'foto' ? 'Foto Progres' : 'Laporan'}
                </button>
              ))}
            </div>
          </div>
          {!isCompleted && (
            <button onClick={() => setUploadOpen(true)} className="flex items-center gap-1.5 text-xs text-[#0f4c81] hover:underline">
              <Plus size={13} /> Tambah Dokumen
            </button>
          )}
        </div>

        {/* Grid Foto */}
        {docTab === 'foto' && (() => {
          const photos = docs.filter(d => d.type === 'Foto' || d.previewUrl)
          return photos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Image size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada foto progres</p>
              {!isCompleted && (
                <button onClick={() => { setDocForm(f => ({ ...f, type: 'Foto' })); setUploadOpen(true) }}
                  className="mt-2 text-xs text-[#0f4c81] hover:underline">Upload foto sekarang</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map(doc => (
                <div
                  key={doc.id}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => doc.previewUrl && setPreviewPhoto(doc)}
                >
                  {doc.previewUrl ? (
                    <>
                      <img src={doc.previewUrl} alt={doc.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Image size={24} className="text-gray-300" />
                      <p className="text-xs text-gray-400 text-center px-2 truncate w-full text-center">{doc.name}</p>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{doc.name}</p>
                    <p className="text-white/70 text-xs">{doc.date}</p>
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDocs(prev => prev.filter(d => d.id !== doc.id)); toast.success('Foto dihapus') }}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })()}

        {/* List Semua / Laporan */}
        {docTab !== 'foto' && (
          <div className="space-y-2">
            {docs
              .filter(d => docTab === 'semua' || (docTab === 'laporan' && d.type !== 'Foto'))
              .map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${doc.previewUrl ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => doc.previewUrl && setPreviewPhoto(doc)}
                >
                  {doc.previewUrl ? (
                    <img src={doc.previewUrl} alt={doc.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : doc.type === 'Foto' ? (
                    <Image size={16} className="text-yellow-500 shrink-0" />
                  ) : (
                    <FileText size={16} className="text-blue-500 shrink-0" />
                  )}                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.type} · {doc.uploader} · {doc.date}</p>
                  </div>
                  {doc.previewUrl && (
                    <ZoomIn size={14} className="text-gray-400 shrink-0" />
                  )}
                  {!isCompleted && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDocs(prev => prev.filter(d => d.id !== doc.id)); toast.success('Dokumen dihapus') }}
                      className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            {docs.filter(d => docTab === 'semua' || (docTab === 'laporan' && d.type !== 'Foto')).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada dokumen</p>
            )}
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={previewPhoto.previewUrl} alt={previewPhoto.name} className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="mt-3 text-center">
              <p className="text-white font-medium text-sm">{previewPhoto.name}</p>
              <p className="text-white/60 text-xs mt-0.5">{previewPhoto.uploader} · {previewPhoto.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* History Aktivitas Proyek */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">History Aktivitas</h3>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{history.length}</span>
        </div>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" />
          <div className="space-y-4">
            {history.map((h, i) => (
              <div key={h.id} className="flex gap-3 relative">
                <div className="shrink-0 z-10">{historyIcon[h.type] || historyIcon.system}</div>
                <div className="flex-1 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{h.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">{h.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{h.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Tandai Selesai */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title="Tandai Proyek Selesai" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Setelah ditandai selesai, proyek tidak dapat diubah kembali ke status aktif. Pastikan semua data sudah lengkap.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Catatan Penyelesaian (opsional)</label>
            <textarea
              rows={3}
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Catatan akhir proyek..."
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setCompleteOpen(false)} className="btn-secondary">Batal</button>
            <button
              onClick={handleMarkComplete}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <CheckCircle size={15} /> Konfirmasi Selesai
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Tambah Material Terpasang */}
      <Modal
        open={materialOpen}
        onClose={() => setMaterialOpen(false)}
        title={`Tambah Material Terpasang — ${selectedMaterial?.name}`}
        size="md"
      >
        <form onSubmit={handleMaterialSubmit} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            Sisa: {selectedMaterial ? selectedMaterial.qty_plan - selectedMaterial.qty_terpasang : 0} {selectedMaterial?.unit}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Qty Terpasang ({selectedMaterial?.unit})
            </label>
            <input
              type="number" min="0.01" step="0.01" required
              value={matForm.qty_tambah}
              onChange={(e) => setMatForm({ ...matForm, qty_tambah: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Masukkan jumlah..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Catatan</label>
            <input
              type="text"
              value={matForm.catatan}
              onChange={(e) => setMatForm({ ...matForm, catatan: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Catatan pemasangan..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Dokumen Perintah <span className="text-red-500">*</span>
            </label>
            <FileUpload
              label="Upload dokumen perintah / berita acara"
              accept={{ 'image/*': [], 'application/pdf': [] }}
              maxFiles={3}
              onFilesChange={(files) => setMatForm({ ...matForm, files })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setMaterialOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Dokumen */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Dokumen Proyek" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Jenis Dokumen</label>
            <select
              value={docForm.type}
              onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>Laporan Harian</option>
              <option>Laporan Mingguan</option>
              <option>Foto</option>
              <option>Dokumen Teknis</option>
            </select>
          </div>
          <FileUpload
            label="Upload Laporan / Foto"
            accept={{ 'image/*': [], 'application/pdf': [] }}
            onFilesChange={(files) => setDocForm({ ...docForm, files })}
          />
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setUploadOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleDocUpload} className="btn-primary">Upload</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
