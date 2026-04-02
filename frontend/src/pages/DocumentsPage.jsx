import { useState } from 'react'
import { FileText, Image, Download, Eye, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'
import { fileToBase64, downloadFile } from '../lib/fileUtils'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import { filterProjectsByRole } from '../lib/permissions'

const typeVariant = {
  'Laporan Harian': 'info', 'Laporan Mingguan': 'success',
  'Foto': 'warning', 'Dokumen Teknis': 'default',
}

export default function DocumentsPage() {
  const { documents, addDoc, deleteDoc, projects } = useAppStore()
  const { user } = useAuthStore()
  const { users } = useUserStore()

  const visibleProjects = filterProjectsByRole(projects, user, users)
  const [open, setOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null) // proyek yang sedang dibuka modal upload
  const [form, setForm] = useState({ type: 'Laporan Harian', files: [] })
  const [preview, setPreview] = useState(null)
  const [expanded, setExpanded] = useState({}) // { projectId: bool }

  const getDocs = (projectId) =>
    documents.filter(d => String(d.projectId) === String(projectId))

  const handleSubmit = async () => {
    if (form.files.length === 0) { toast.error('Pilih file terlebih dahulu'); return }
    const file = form.files[0]
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    const resolvedType = isImage ? 'Foto' : form.type
    const base64 = await fileToBase64(file)
    addDoc({
      name: file.name,
      type: resolvedType,
      uploader: user?.name || 'Unknown',
      date: new Date().toLocaleDateString('id-ID'),
      previewUrl: base64,
      fileType: isImage ? 'image' : isPdf ? 'pdf' : 'other',
      projectId: selectedProjectId,
    })
    toast.success('Dokumen berhasil ditambahkan')
    setOpen(false)
    setForm({ type: 'Laporan Harian', files: [] })
  }

  const handlePreview = (doc) => {
    if (!doc.previewUrl) { toast('File tidak bisa dipreview', { icon: 'ℹ️' }); return }
    if (doc.fileType === 'pdf') {
      const win = window.open()
      win.document.write(`<iframe src="${doc.previewUrl}" style="width:100%;height:100vh;border:none"></iframe>`)
    } else {
      setPreview(doc)
    }
  }

  const totalDocs = visibleProjects.reduce((s, p) => s + getDocs(p.id).length, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dokumen Proyek</h1>
        <p className="text-sm text-gray-500 mt-0.5">{totalDocs} dokumen dari {visibleProjects.length} proyek</p>
      </div>

      {visibleProjects.length === 0 && (
        <div className="card text-center py-12 text-gray-400 text-sm">Belum ada proyek</div>
      )}

      <div className="space-y-4">
        {visibleProjects.map(p => {
          const docs = getDocs(p.id)
          const isOpen = expanded[p.id] ?? true

          return (
            <div key={p.id} className="card p-0 overflow-hidden">
              {/* Card Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !isOpen }))}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-blue-600"/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location} · {docs.length} dokumen</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedProjectId(p.id); setForm({ type: 'Laporan Harian', files: [] }); setOpen(true) }}
                    className="flex items-center gap-1.5 text-xs bg-[#0f4c81] hover:bg-[#1a6bb5] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Plus size={12}/> Tambah
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                </div>
              </div>

              {/* Doc List */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  {docs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Belum ada dokumen untuk proyek ini</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                          {doc.fileType === 'image' && doc.previewUrl
                            ? <img src={doc.previewUrl} alt={doc.name} className="w-9 h-9 rounded-lg object-cover shrink-0"/>
                            : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                {doc.type === 'Foto' ? <Image size={14} className="text-yellow-500"/> : <FileText size={14} className="text-blue-500"/>}
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-400">{doc.uploader} · {doc.date}</p>
                          </div>
                          <Badge variant={typeVariant[doc.type] || 'default'}>{doc.type}</Badge>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handlePreview(doc)}
                              className={`p-1.5 rounded transition-colors ${doc.previewUrl ? 'hover:bg-blue-50 text-gray-400 hover:text-blue-600' : 'text-gray-200 cursor-not-allowed'}`}>
                              <Eye size={14}/>
                            </button>
                            <button onClick={() => doc.previewUrl && downloadFile(doc.previewUrl, doc.name)}
                              className={`p-1.5 rounded transition-colors ${doc.previewUrl ? 'hover:bg-green-50 text-gray-400 hover:text-green-600' : 'text-gray-200 cursor-not-allowed'}`}>
                              <Download size={14}/>
                            </button>
                            <button onClick={() => { deleteDoc(doc.id); toast.success('Dokumen dihapus') }}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Photo Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={20}/></button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={preview.previewUrl} alt={preview.name} className="w-full max-h-[80vh] object-contain rounded-xl"/>
            <p className="text-white text-center text-sm mt-3">{preview.name}</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={`Tambah Dokumen — ${visibleProjects.find(p => String(p.id) === String(selectedProjectId))?.name || ''}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Jenis Dokumen</label>
            <input type="text" list="doc-types" value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Pilih atau ketik..."/>
            <datalist id="doc-types">
              {['Laporan Harian','Laporan Mingguan','Foto','Dokumen Teknis','Berita Acara','Surat Perintah Kerja','As Built Drawing'].map(t => (
                <option key={t} value={t}/>
              ))}
            </datalist>
          </div>
          <FileUpload key={open ? 'open' : 'closed'} label="Upload File (PDF / Gambar)"
            accept={{ 'image/*': [], 'application/pdf': [] }} maxFiles={1}
            onFilesChange={files => setForm(f => ({ ...f, files }))}/>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSubmit} className="btn-primary">Simpan</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
