import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Plus, FileText, Image, Trash2 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'

// Mock activity log store (shared with ActivityLogPage via localStorage simulation)
const addActivityLog = (action, detail) => {
  const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]')
  logs.unshift({
    id: Date.now(),
    user: 'Budi Santoso',
    role: 'Project Manager',
    action,
    detail,
    project: 'RS Sentral Amsar',
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
  { id: 1, name: 'Laporan Harian 22 Mar', type: 'Laporan Harian', uploader: 'Budi S.', date: '22 Mar 2026' },
  { id: 2, name: 'Foto Pekerjaan Lantai 3', type: 'Foto', uploader: 'Ahmad F.', date: '21 Mar 2026' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [materialOpen, setMaterialOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [materials, setMaterials] = useState(MOCK_MATERIALS)
  const [docs, setDocs] = useState(MOCK_DOCS)

  // Material progress form
  const [matForm, setMatForm] = useState({ qty_tambah: '', catatan: '', files: [] })

  // Upload doc form
  const [docForm, setDocForm] = useState({ type: 'Laporan Harian', files: [] })

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
    // Auto activity log
    addActivityLog(
      'Update Material Terpasang',
      `Tambah ${qty} ${selectedMaterial.unit} untuk ${selectedMaterial.name} — ${matForm.catatan || '-'}`
    )
    toast.success('Material terpasang berhasil diupdate')
    setMaterialOpen(false)
    setMatForm({ qty_tambah: '', catatan: '', files: [] })
  }

  const handleDocUpload = () => {
    if (docForm.files.length === 0) {
      toast.error('Pilih file terlebih dahulu')
      return
    }
    const newDoc = {
      id: Date.now(),
      name: docForm.files[0].name,
      type: docForm.type,
      uploader: 'Budi S.',
      date: new Date().toLocaleDateString('id-ID'),
    }
    setDocs(prev => [newDoc, ...prev])
    // Auto activity log
    addActivityLog('Upload Dokumen', `Upload ${docForm.type}: ${newDoc.name}`)
    toast.success('Dokumen berhasil diupload')
    setUploadOpen(false)
    setDocForm({ type: 'Laporan Harian', files: [] })
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
          <h1 className="text-xl font-bold text-gray-900">RS Sentral Amsar</h1>
          <p className="text-sm text-gray-500">Jakarta Selatan · PM: Budi Santoso</p>
        </div>
        <Badge variant="success">On Track</Badge>
        <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2">
          <Upload size={15} /> Upload Dokumen
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Progress', value: '72%', sub: 'Target: 75%' },
          { label: 'RAB Terealisasi', value: 'Rp 720jt', sub: 'RAB: Rp 850jt' },
          { label: 'Teknisi PT Amsar', value: '24 Orang', sub: 'Aktif hari ini' },
          { label: 'Sisa Waktu', value: '190 Hari', sub: 'Deadline: 30 Sep 2026' },
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
                    <button
                      onClick={() => openMaterialModal(mat)}
                      className="flex items-center gap-1 text-xs bg-[#0f4c81] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#1a6bb5] transition-colors"
                    >
                      <Plus size={12} /> Tambah
                    </button>
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
          <h3 className="text-sm font-semibold text-gray-700">Dokumen Proyek</h3>
          <button onClick={() => setUploadOpen(true)} className="flex items-center gap-1.5 text-xs text-[#0f4c81] hover:underline">
            <Plus size={13} /> Tambah Dokumen
          </button>
        </div>
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {doc.type === 'Foto'
                ? <Image size={16} className="text-yellow-500 shrink-0" />
                : <FileText size={16} className="text-blue-500 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.type} · {doc.uploader} · {doc.date}</p>
              </div>
              <button
                onClick={() => {
                  setDocs(prev => prev.filter(d => d.id !== doc.id))
                  toast.success('Dokumen dihapus')
                }}
                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {docs.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada dokumen</p>
          )}
        </div>
      </div>

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
