import { useState, useEffect } from 'react'
import { FileText, Image, Download, Eye, Plus, Trash2, X, ChevronDown, ChevronUp, Loader2, FolderOpen, Upload, Info } from '@icons'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import { filterProjectsByRole } from '../lib/permissions'

const typeVariant = {
  'Laporan Harian': 'info',
  'Laporan Mingguan': 'success',
  'Foto': 'warning',
  'Dokumen Teknis': 'default',
  'Berita Acara': 'info',
  'Surat Perintah Kerja': 'default',
  'As Built Drawing': 'success',
}

const DOC_TYPES = [
  'Laporan Harian',
  'Laporan Mingguan',
  'Foto',
  'Dokumen Teknis',
  'Berita Acara',
  'Surat Perintah Kerja',
  'As Built Drawing',
]

export default function DocumentsPage() {
  const { documents, documentsLoading, addDoc, deleteDoc, fetchDocuments, projects, projectsLoading, fetchProjects } = useAppStore()
  const { user } = useAuthStore()
  const { users } = useUserStore()

  const visibleProjects = filterProjectsByRole(projects, user, users)

  const [open, setOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [form, setForm] = useState({ type: 'Laporan Harian', files: [] })
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [deletingId, setDeletingId] = useState(null)

  // Fetch on mount
  useEffect(() => {
    fetchProjects()
    fetchDocuments()
  }, [])

  const getDocs = (projectId) =>
    documents.filter(d => String(d.projectId) === String(projectId))

  const handleOpenUpload = (e, projectId) => {
    e.stopPropagation()
    setSelectedProjectId(projectId)
    setForm({ type: 'Laporan Harian', files: [] })
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (form.files.length === 0) { toast.error('Pilih file terlebih dahulu'); return }
    if (!selectedProjectId) { toast.error('Proyek tidak valid'); return }

    const file = form.files[0]
    const isImage = file.type.startsWith('image/')
    const resolvedType = isImage ? 'Foto' : (form.type || 'Laporan Harian')

    const formData = new FormData()
    formData.append('project_id', selectedProjectId)
    formData.append('type', resolvedType)
    formData.append('file', file)

    try {
      setUploading(true)
      await addDoc(formData)
      toast.success('Dokumen berhasil diunggah!')
      setOpen(false)
      setForm({ type: 'Laporan Harian', files: [] })
    } catch (err) {
      const errMsg = err?.errors
        ? Object.values(err.errors).flat().join(', ')
        : err?.message || 'Gagal mengunggah dokumen'
      toast.error(errMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Yakin hapus dokumen ini?')) return
    try {
      setDeletingId(docId)
      await deleteDoc(docId)
      toast.success('Dokumen dihapus')
    } catch {
      toast.error('Gagal menghapus dokumen')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreview = (doc) => {
    if (!doc.previewUrl) {
      toast('File tidak bisa dipreview', {
        icon: <Info size={18} className='text-[#de168c]' />
      })
      return
    }
    if (doc.fileType === 'pdf') {
      window.open(doc.previewUrl, '_blank')
    } else {
      setPreview(doc)
    }
  }

  const handleDownload = (doc) => {
    if (!doc.previewUrl) return
    const a = document.createElement('a')
    a.href = doc.previewUrl
    a.download = doc.name
    a.target = '_blank'
    a.click()
  }

  const totalDocs = visibleProjects.reduce((s, p) => s + getDocs(p.id).length, 0)
  const selectedProject = visibleProjects.find(p => String(p.id) === String(selectedProjectId))

  const isLoading = projectsLoading || documentsLoading

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dokumen Proyek</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? 'Memuat...' : `${totalDocs} dokumen dari ${visibleProjects.length} proyek`}
          </p>
        </div>
        {documentsLoading && (
          <Loader2 size={18} className="animate-spin text-blue-500 mt-1" />
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && visibleProjects.length === 0 && (
        <div className="card text-center py-16">
          <FolderOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Belum ada proyek</p>
          <p className="text-xs text-gray-400 mt-1">Proyek yang ditugaskan akan muncul di sini</p>
        </div>
      )}

      {/* Projects List */}
      {!isLoading && (
        <div className="space-y-4">
          {visibleProjects.map(p => {
            const docs = getDocs(p.id)
            const isOpen = expanded[p.id] ?? true

            return (
              <div key={p.id} className="card p-0 overflow-hidden">
                {/* Project Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !isOpen }))}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.location} Ã‚Â· <span className="font-medium text-blue-500">{docs.length} dokumen</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id={`upload-doc-${p.id}`}
                      onClick={(e) => handleOpenUpload(e, p.id)}
                      className="flex items-center gap-1.5 text-xs bg-[#237043] hover:bg-[#5a9844] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <Upload size={12} /> Unggah
                    </button>
                    {isOpen
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </div>
                </div>

                {/* Document List */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {docs.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-gray-400">
                        <FolderOpen size={28} className="mb-2 text-gray-300" />
                        <p className="text-xs">Belum ada dokumen untuk proyek ini</p>
                        <button
                          onClick={(e) => handleOpenUpload(e, p.id)}
                          className="mt-2 text-xs text-blue-500 hover:underline"
                        >
                          + Unggah sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                            {/* Thumbnail */}
                            {doc.fileType === 'image' && doc.previewUrl
                              ? <img src={doc.previewUrl} alt={doc.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                              : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  {doc.fileType === 'image' || doc.type === 'Foto'
                                    ? <Image size={15} className="text-yellow-500" />
                                    : <FileText size={15} className="text-blue-500" />
                                  }
                                </div>
                              )
                            }

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">{doc.uploader} Ã‚Â· {doc.date}</p>
                            </div>

                            <Badge variant={typeVariant[doc.type] || 'default'}>{doc.type}</Badge>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                title="Preview"
                                onClick={() => handlePreview(doc)}
                                className={`p-1.5 rounded transition-colors ${doc.previewUrl ? 'hover:bg-blue-50 text-gray-400 hover:text-blue-600' : 'text-gray-200 cursor-not-allowed'}`}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                title="Download"
                                onClick={() => handleDownload(doc)}
                                className={`p-1.5 rounded transition-colors ${doc.previewUrl ? 'hover:bg-green-50 text-gray-400 hover:text-green-600' : 'text-gray-200 cursor-not-allowed'}`}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                title="Hapus"
                                onClick={() => handleDelete(doc.id)}
                                disabled={deletingId === doc.id}
                                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              >
                                {deletingId === doc.id
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <Trash2 size={14} />
                                }
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
      )}

      {/* Photo Preview Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setPreview(null)}
          >
            <X size={20} />
          </button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={preview.previewUrl}
              alt={preview.name}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white text-center text-sm mt-3 opacity-75">{preview.name}</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={open}
        onClose={() => { if (!uploading) setOpen(false) }}
        title={`Unggah Dokumen Ã¢â‚¬â€ ${selectedProject?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Doc type selector */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Jenis Dokumen</label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    form.type === t
                      ? 'bg-[#237043] text-white border-[#237043]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#237043] hover:text-[#237043]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <FileUpload
            key={open ? 'open' : 'closed'}
            label="Upload File (PDF / Gambar, maks. 20 MB)"
            accept={{ 'image/*': [], 'application/pdf': [] }}
            maxFiles={1}
            onFilesChange={files => setForm(f => ({ ...f, files }))}
          />

          {/* Selected file info */}
          {form.files.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <FileText size={13} />
              <span className="truncate font-medium">{form.files[0].name}</span>
              <span className="text-blue-400 shrink-0">({(form.files[0].size / 1024).toFixed(0)} KB)</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setOpen(false)}
              disabled={uploading}
              className="btn-secondary disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || form.files.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Simpan
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

