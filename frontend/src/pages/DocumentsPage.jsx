import { useState } from 'react'
import { FileText, Image, Download, Eye, Plus, Trash2 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'

const addActivityLog = (action, detail) => {
  const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]')
  logs.unshift({
    id: Date.now(),
    user: 'Budi Santoso',
    role: 'Project Manager',
    action,
    detail,
    project: '-',
    time: new Date().toLocaleString('id-ID'),
  })
  localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 50)))
}

const INIT_DOCS = [
  { id: 1, name: 'Laporan Harian 22 Mar 2026', project: 'RS Sentral Amsar', type: 'Laporan Harian', uploader: 'Budi S.', date: '22 Mar 2026', size: '1.2 MB' },
  { id: 2, name: 'Foto Pekerjaan Lantai 3', project: 'RS Sentral Amsar', type: 'Foto', uploader: 'Ahmad F.', date: '21 Mar 2026', size: '4.5 MB' },
  { id: 3, name: 'Laporan Mingguan W12', project: 'Klinik Utama Barat', type: 'Laporan Mingguan', uploader: 'Siti R.', date: '20 Mar 2026', size: '2.1 MB' },
  { id: 4, name: 'Dokumen Teknis MEP', project: 'Lab Medis Timur', type: 'Dokumen Teknis', uploader: 'Dewi L.', date: '19 Mar 2026', size: '3.8 MB' },
]

const typeVariant = {
  'Laporan Harian':   'info',
  'Laporan Mingguan': 'success',
  'Foto':             'warning',
  'Dokumen Teknis':   'default',
}

const PROJECTS = ['RS Sentral Amsar', 'Klinik Utama Barat', 'Lab Medis Timur', 'Apotek Cabang 3']

export default function DocumentsPage() {
  const [docs, setDocs] = useState(INIT_DOCS)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ project: PROJECTS[0], type: 'Laporan Harian', files: [] })

  const handleSubmit = () => {
    if (form.files.length === 0) {
      toast.error('Pilih file terlebih dahulu')
      return
    }
    const newDoc = {
      id: Date.now(),
      name: form.files[0].name,
      project: form.project,
      type: form.type,
      uploader: 'Budi S.',
      date: new Date().toLocaleDateString('id-ID'),
      size: `${(form.files[0].size / 1024 / 1024).toFixed(1)} MB`,
    }
    setDocs(prev => [newDoc, ...prev])
    addActivityLog('Upload Dokumen', `Upload ${form.type}: ${newDoc.name} — Proyek: ${form.project}`)
    toast.success('Dokumen berhasil ditambahkan')
    setOpen(false)
    setForm({ project: PROJECTS[0], type: 'Laporan Harian', files: [] })
  }

  const handleDelete = (id, name) => {
    setDocs(prev => prev.filter(d => d.id !== id))
    addActivityLog('Hapus Dokumen', `Hapus dokumen: ${name}`)
    toast.success('Dokumen dihapus')
  }

  const columns = [
    { key: 'name', label: 'Nama File', render: (v, row) => (
      <div className="flex items-center gap-2">
        {row.type === 'Foto' ? <Image size={14} className="text-yellow-500" /> : <FileText size={14} className="text-blue-500" />}
        <span className="font-medium text-gray-800">{v}</span>
      </div>
    )},
    { key: 'project', label: 'Proyek' },
    { key: 'type', label: 'Tipe', render: (v) => <Badge variant={typeVariant[v] || 'default'}>{v}</Badge> },
    { key: 'uploader', label: 'Diupload Oleh' },
    { key: 'date', label: 'Tanggal' },
    { key: 'size', label: 'Ukuran' },
    { key: 'id', label: 'Aksi', render: (v, row) => (
      <div className="flex items-center gap-2">
        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"><Eye size={14} /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600 transition-colors"><Download size={14} /></button>
        <button onClick={() => handleDelete(v, row.name)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dokumen Proyek</h1>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Tambah Dokumen
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={docs} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Dokumen" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Proyek</label>
            <select
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PROJECTS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Jenis Dokumen</label>
            <input
              type="text"
              list="doc-types"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Pilih atau ketik jenis dokumen..."
            />
            <datalist id="doc-types">
              <option value="Laporan Harian" />
              <option value="Laporan Mingguan" />
              <option value="Foto" />
              <option value="Dokumen Teknis" />
              <option value="Berita Acara" />
              <option value="Surat Perintah Kerja" />
              <option value="As Built Drawing" />
            </datalist>
          </div>
          <FileUpload
            label="Upload File"
            accept={{ 'image/*': [], 'application/pdf': [] }}
            maxFiles={1}
            onFilesChange={(files) => setForm({ ...form, files })}
          />
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSubmit} className="btn-primary">Simpan</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
