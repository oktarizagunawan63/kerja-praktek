import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Plus, FileText, Image, Trash2,
  CheckCircle, Clock, AlertTriangle, X, ZoomIn, Download
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useAppStore from '../store/appStore'
import { fileToBase64, downloadFile } from '../lib/fileUtils'
import { formatRupiah } from '../lib/formatRupiah'

// ── constants ─────────────────────────────────────────────────────────────────
const SATUAN = ['m3','m2','m','ton','kg','btg','unit','set','ls','buah','liter','zak']

const HIcon = {
  material: <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center"><Plus size={13} className="text-blue-600"/></div>,
  dokumen:  <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center"><FileText size={13} className="text-yellow-600"/></div>,
  selesai:  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle size={13} className="text-green-600"/></div>,
  system:   <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"><Clock size={13} className="text-gray-500"/></div>,
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const loadDocs  = (id) => { try { return JSON.parse(localStorage.getItem(`pdocs_${id}`) || '[]') } catch { return [] } }
const saveDocs  = (id, d) => localStorage.setItem(`pdocs_${id}`, JSON.stringify(d))

// ── component ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()
  const currentUser  = user?.name || 'Unknown'
  const {
    projects, getMaterials, addMaterial,
    updateMaterialQty, deleteMaterial,
    markComplete, addActivity, updateProject,
  } = useAppStore()

  // ── all hooks before any return ──
  const [docs,         setDocs]         = useState(() => loadDocs(id))
  const [history,      setHistory]      = useState([])
  const [uploadOpen,   setUploadOpen]   = useState(false)
  const [matOpen,      setMatOpen]      = useState(false)
  const [addMatOpen,   setAddMatOpen]   = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [editRabOpen,  setEditRabOpen]  = useState(false)
  const [selMat,       setSelMat]       = useState(null)
  const [previewDoc,   setPreviewDoc]   = useState(null)
  const [docTab,       setDocTab]       = useState('semua')
  const [completeNote, setCompleteNote] = useState('')
  const [rabInput,     setRabInput]     = useState('')
  const [matForm,      setMatForm]      = useState({ qty: '', catatan: '', files: [] })
  const [docForm,      setDocForm]      = useState({ type: 'Laporan Harian', files: [] })
  const [newMat,       setNewMat]       = useState({ name: '', unit: 'm3', qty_plan: '', qty_terpasang: '' })

  const project   = projects.find(p => String(p.id) === String(id))
  const materials = getMaterials(id)
  const isCompleted = project?.status === 'completed'

  const progressVal = materials.length
    ? Math.round(materials.reduce((s, m) => s + Math.min((m.qty_terpasang / m.qty_plan) * 100, 100), 0) / materials.length)
    : project?.progress || 0

  // ── early return after all hooks ──
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-semibold">Proyek tidak ditemukan</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-sm text-[#0f4c81] hover:underline">Kembali</button>
      </div>
    )
  }

  // ── helpers ──
  const updateDocs = (d) => { setDocs(d); saveDocs(id, d) }
  const addHist    = (e) => setHistory(p => [{ id: Date.now(), ...e, time: new Date().toLocaleString('id-ID') }, ...p])

  // ── handlers ──
  const handleMatSubmit = async (e) => {
    e.preventDefault()
    if (!matForm.qty || matForm.files.length === 0) { toast.error('Isi qty dan upload dokumen perintah'); return }
    const qty = parseInt(matForm.qty)
    updateMaterialQty(id, selMat.id, qty, matForm.catatan)
    const newDocs = await Promise.all(matForm.files.map(async file => {
      const isImg = file.type.startsWith('image/')
      return { id: Date.now() + Math.random(), name: file.name, type: isImg ? 'Foto' : 'Dokumen Teknis', uploader: currentUser.split(' ')[0], date: new Date().toLocaleDateString('id-ID'), previewUrl: await fileToBase64(file), fileType: isImg ? 'image' : 'pdf', projectId: id }
    }))
    if (newDocs.length) updateDocs([...newDocs, ...docs])
    const detail = `Tambah ${qty} ${selMat.unit} ${selMat.name}${matForm.catatan ? ' — ' + matForm.catatan : ''}`
    addActivity({ action: 'Update Material Terpasang', detail, projectId: id })
    addHist({ action: 'Update Material Terpasang', detail, user: currentUser, type: 'material' })
    toast.success('Material berhasil diupdate')
    setMatOpen(false); setMatForm({ qty: '', catatan: '', files: [] })
  }

  const handleAddMat = (e) => {
    e.preventDefault()
    if (!newMat.name || !newMat.qty_plan) { toast.error('Nama dan qty rencana wajib diisi'); return }
    if (materials.find(m => m.name.toLowerCase() === newMat.name.toLowerCase())) { toast.error('Material sudah ada'); return }
    const mat = addMaterial(id, { name: newMat.name, unit: newMat.unit, qty_plan: parseInt(newMat.qty_plan), qty_terpasang: parseInt(newMat.qty_terpasang) || 0 })
    addHist({ action: 'Tambah Material', detail: `${mat.name} (${mat.qty_plan} ${mat.unit})`, user: currentUser, type: 'material' })
    toast.success(`${mat.name} ditambahkan`)
    setAddMatOpen(false); setNewMat({ name: '', unit: 'm3', qty_plan: '', qty_terpasang: '' })
  }

  const handleDocUpload = async () => {
    if (docForm.files.length === 0) { toast.error('Pilih file terlebih dahulu'); return }
    const file = docForm.files[0]
    const isImg = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    const type  = isImg ? 'Foto' : docForm.type
    const doc   = { id: Date.now(), name: file.name, type, uploader: currentUser.split(' ')[0], date: new Date().toLocaleDateString('id-ID'), previewUrl: await fileToBase64(file), fileType: isImg ? 'image' : isPdf ? 'pdf' : 'other', projectId: id }
    updateDocs([doc, ...docs])
    addActivity({ action: 'Upload Dokumen', detail: `Upload ${type}: ${doc.name}`, projectId: id })
    addHist({ action: 'Upload Dokumen', detail: `Upload ${type}: ${doc.name}`, user: currentUser, type: 'dokumen' })
    toast.success('Dokumen berhasil diupload')
    setUploadOpen(false); setDocForm({ type: 'Laporan Harian', files: [] })
  }

  const handleComplete = () => {
    markComplete(id, completeNote)
    addHist({ action: 'Proyek Selesai', detail: `Selesai${completeNote ? ' — ' + completeNote : ''}`, user: currentUser, type: 'selesai' })
    toast.success('Proyek ditandai selesai')
    setCompleteOpen(false); setCompleteNote('')
  }

  const handleSaveRab = () => {
    const num = parseFloat(String(rabInput).replace(/\./g, ''))
    if (isNaN(num) || num < 0) { toast.error('Masukkan angka yang valid'); return }
    updateProject(id, { realisasi: num })
    addActivity({ action: 'Update RAB Terealisasi', detail: `RAB terealisasi: ${formatRupiah(num)}`, projectId: id })
    addHist({ action: 'Update RAB Terealisasi', detail: `RAB terealisasi: ${formatRupiah(num)}`, user: currentUser, type: 'system' })
    toast.success('RAB Terealisasi diupdate')
    setEditRabOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} className="text-gray-600"/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.location} · PM: {project.pm}</p>
        </div>
        {isCompleted
          ? <Badge variant="info">Selesai</Badge>
          : <Badge variant={project.status==='at_risk'?'warning':project.status==='delayed'?'danger':'success'}>
              {project.status==='at_risk'?'At Risk':project.status==='delayed'?'Delayed':'On Track'}
            </Badge>
        }
        {!isCompleted && <>
          <button onClick={() => setCompleteOpen(true)} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
            <CheckCircle size={15}/> Tandai Selesai
          </button>
          <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2">
            <Upload size={15}/> Upload Dokumen
          </button>
        </>}
      </div>

      {isCompleted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0"/>
          <div>
            <p className="text-sm font-semibold text-green-800">Proyek Telah Selesai</p>
            <p className="text-xs text-green-600">Selesai pada {project.completedAt ? new Date(project.completedAt).toLocaleDateString('id-ID') : '-'}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Progress</p>
          <p className="text-xl font-bold text-gray-900">{isCompleted ? '100%' : `${progressVal}%`}</p>
          <p className="text-xs text-gray-400 mt-0.5">{materials.length} material</p>
        </div>

        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">RAB Terealisasi</p>
          <p className="text-xl font-bold text-gray-900">{formatRupiah(project.realisasi || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">RAB: {formatRupiah(project.rab)}</p>
          {!isCompleted && (
            <button onClick={() => { 
                const val = project.realisasi || 0
                setRabInput(val ? Number(val).toLocaleString('id-ID') : '')
                setEditRabOpen(true) 
              }}
              className="mt-1.5 text-xs text-blue-500 hover:text-blue-700 hover:underline">
              Edit Realisasi
            </button>
          )}
        </div>

        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Teknisi PT Amsar</p>
          <p className="text-xl font-bold text-gray-900">24 Orang</p>
          <p className="text-xs text-gray-400 mt-0.5">Aktif hari ini</p>
        </div>

        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Sisa Waktu</p>
          <p className="text-xl font-bold text-gray-900">
            {isCompleted ? '—' : `${Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / 86400000))} Hari`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Deadline: {new Date(project.deadline).toLocaleDateString('id-ID')}</p>
        </div>
      </div>

      {/* Material Terpasang */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Material Terpasang</h3>
          {!isCompleted && <button onClick={() => setAddMatOpen(true)} className="flex items-center gap-1.5 text-xs text-[#0f4c81] hover:underline"><Plus size={13}/> Tambah Material</button>}
        </div>
        <div className="space-y-3">
          {materials.map(mat => {
            const pct = Math.round((mat.qty_terpasang / mat.qty_plan) * 100)
            return (
              <div key={mat.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mat.name}</p>
                    <p className="text-xs text-gray-400">Terpasang: {mat.qty_terpasang} / {mat.qty_plan} {mat.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${pct>=100?'text-green-600':'text-gray-600'}`}>{Math.min(pct,100)}%</span>
                    {!isCompleted && <>
                      <button onClick={() => { setSelMat(mat); setMatForm({ qty:'', catatan:'', files:[] }); setMatOpen(true) }}
                        className="flex items-center gap-1 text-xs bg-[#0f4c81] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#1a6bb5]">
                        <Plus size={12}/> Tambah
                      </button>
                      <button onClick={() => { deleteMaterial(id, mat.id); toast.success(`${mat.name} dihapus`) }}
                        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                    </>}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct>=100?'bg-green-500':'bg-blue-500'}`} style={{width:`${Math.min(pct,100)}%`}}/>
                </div>
              </div>
            )
          })}
          {materials.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Belum ada material — klik "+ Tambah Material"</p>}
        </div>
      </div>

      {/* Dokumen Proyek */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-700">Dokumen Proyek</h3>
            <div className="flex gap-1">
              {['semua','foto','laporan'].map(tab => (
                <button key={tab} onClick={() => setDocTab(tab)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${docTab===tab?'bg-[#0f4c81] text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {tab==='semua'?'Semua':tab==='foto'?'Foto Progres':'Laporan'}
                </button>
              ))}
            </div>
          </div>
          {!isCompleted && <button onClick={() => setUploadOpen(true)} className="flex items-center gap-1.5 text-xs text-[#0f4c81] hover:underline"><Plus size={13}/> Tambah Dokumen</button>}
        </div>

        {docTab === 'foto' && (() => {
          const photos = docs.filter(d => d.fileType === 'image')
          return photos.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Belum ada foto progres</p>
            : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map(doc => (
                  <div key={doc.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                    <img src={doc.previewUrl} alt={doc.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100"/>
                    </div>
                    {!isCompleted && <button onClick={e => { e.stopPropagation(); updateDocs(docs.filter(d=>d.id!==doc.id)); toast.success('Foto dihapus') }}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100"><Trash2 size={11}/></button>}
                  </div>
                ))}
              </div>
        })()}

        {docTab !== 'foto' && (
          <div className="space-y-2">
            {docs.filter(d => docTab==='semua' || d.fileType!=='image').map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {doc.fileType==='image' && doc.previewUrl
                  ? <img src={doc.previewUrl} alt={doc.name} className="w-10 h-10 rounded-lg object-cover shrink-0 cursor-pointer" onClick={() => setPreviewDoc(doc)}/>
                  : doc.fileType==='image' ? <Image size={16} className="text-yellow-500 shrink-0"/> : <FileText size={16} className="text-blue-500 shrink-0"/>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.type} · {doc.uploader} · {doc.date}</p>
                </div>
                {doc.previewUrl && <button onClick={() => downloadFile(doc.previewUrl, doc.name)} className="p-1.5 hover:bg-green-50 rounded text-gray-400 hover:text-green-600"><Download size={14}/></button>}
                {!isCompleted && <button onClick={() => { updateDocs(docs.filter(d=>d.id!==doc.id)); toast.success('Dokumen dihapus') }}
                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}
              </div>
            ))}
            {docs.filter(d => docTab==='semua' || d.fileType!=='image').length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada dokumen</p>}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-400"/>
          <h3 className="text-sm font-semibold text-gray-700">History Aktivitas</h3>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{history.length}</span>
        </div>
        <div className="space-y-4">
          {history.map(h => (
            <div key={h.id} className="flex gap-3">
              <div className="shrink-0">{HIcon[h.type] || HIcon.system}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{h.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{h.detail}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{h.time}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{h.user}</p>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada aktivitas</p>}
        </div>
      </div>

      {/* Photo Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={20}/></button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {previewDoc.fileType==='pdf'
              ? <iframe src={previewDoc.previewUrl} className="w-full h-[80vh] rounded-xl" title={previewDoc.name}/>
              : <img src={previewDoc.previewUrl} alt={previewDoc.name} className="w-full max-h-[80vh] object-contain rounded-xl"/>
            }
            <div className="mt-3 text-center">
              <p className="text-white font-medium text-sm">{previewDoc.name}</p>
              <button onClick={() => downloadFile(previewDoc.previewUrl, previewDoc.name)} className="mt-1 text-xs text-white/70 hover:text-white underline">Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tandai Selesai */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title="Tandai Proyek Selesai" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-700">Setelah ditandai selesai, status tidak bisa diubah kembali.</p>
          </div>
          <textarea rows={3} value={completeNote} onChange={e => setCompleteNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Catatan akhir proyek (opsional)..."/>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCompleteOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleComplete} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
              <CheckCircle size={15}/> Konfirmasi Selesai
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit RAB Terealisasi */}
      <Modal open={editRabOpen} onClose={() => setEditRabOpen(false)} title="Update RAB Terealisasi" size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            RAB Proyek: <span className="font-semibold text-gray-800">{formatRupiah(project.rab)}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Realisasi (Rp)</label>
            <input type="text" value={rabInput} onChange={e => {
                const raw = e.target.value.replace(/\D/g, '')
                setRabInput(raw ? Number(raw).toLocaleString('id-ID') : '')
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: 5.000.000" autoFocus/>
            {rabInput && (() => {
              const num = parseFloat(String(rabInput).replace(/\./g, ''))
              if (isNaN(num) || num <= 0) return null
              const isOver = num > project.rab
              return <p className={`mt-1 text-xs font-medium ${isOver?'text-red-500':'text-blue-600'}`}>{formatRupiah(num)}{isOver?' ⚠️ Melebihi RAB!':''}</p>
            })()}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditRabOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSaveRab} className="btn-primary">Simpan</button>
          </div>
        </div>
      </Modal>

      {/* Modal: Tambah Material Terpasang */}
      <Modal open={matOpen} onClose={() => setMatOpen(false)} title={`Tambah Terpasang — ${selMat?.name}`} size="md">
        <form onSubmit={handleMatSubmit} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            Sisa: {selMat ? selMat.qty_plan - selMat.qty_terpasang : 0} {selMat?.unit}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Qty Terpasang ({selMat?.unit})</label>
            <input type="number" min="1" step="1" required value={matForm.qty} onChange={e => setMatForm({...matForm, qty: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Masukkan jumlah..."/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Catatan</label>
            <input type="text" value={matForm.catatan} onChange={e => setMatForm({...matForm, catatan: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Catatan pemasangan..."/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Dokumen Perintah <span className="text-red-500">*</span></label>
            <FileUpload key={matOpen ? selMat?.id : 'closed'} label="Upload dokumen perintah / berita acara"
              accept={{'image/*':[], 'application/pdf':[]}} maxFiles={3}
              onFilesChange={files => setMatForm(p => ({...p, files}))}/>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setMatOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Tambah Material Baru */}
      <Modal open={addMatOpen} onClose={() => setAddMatOpen(false)} title="Tambah Material Baru" size="md">
        <form onSubmit={handleAddMat} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nama Material</label>
            <input type="text" required value={newMat.name} onChange={e => setNewMat({...newMat, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Contoh: Bata Merah..."/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Satuan</label>
              <select value={newMat.unit} onChange={e => setNewMat({...newMat, unit: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                {SATUAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Qty Rencana</label>
              <input type="number" min="1" required value={newMat.qty_plan} onChange={e => setNewMat({...newMat, qty_plan: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Qty Awal</label>
              <input type="number" min="0" value={newMat.qty_terpasang} onChange={e => setNewMat({...newMat, qty_terpasang: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0"/>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setAddMatOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Tambah</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Dokumen */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Dokumen Proyek" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Jenis Dokumen</label>
            <input type="text" list="doc-types-detail" value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Pilih atau ketik..."/>
            <datalist id="doc-types-detail">
              {['Laporan Harian','Laporan Mingguan','Foto','Dokumen Teknis','Berita Acara','Surat Perintah Kerja','As Built Drawing'].map(t => <option key={t} value={t}/>)}
            </datalist>
          </div>
          <FileUpload key={uploadOpen?'open':'closed'} label="Upload File (PDF / Gambar)"
            accept={{'image/*':[], 'application/pdf':[]}} maxFiles={1}
            onFilesChange={files => setDocForm(f => ({...f, files}))}/>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setUploadOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleDocUpload} className="btn-primary">Upload</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
