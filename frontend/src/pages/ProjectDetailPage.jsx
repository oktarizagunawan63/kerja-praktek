import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/kpi/ProgressBar'
import TimelineChart from '../components/charts/TimelineChart'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import toast from 'react-hot-toast'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [progressForm, setProgressForm] = useState({ persen: '', kendala: '', catatan: '' })

  const handleProgressSubmit = (e) => {
    e.preventDefault()
    toast.success('Progress berhasil disimpan')
    setProgressForm({ persen: '', kendala: '', catatan: '' })
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
          { label: 'Budget Terserap', value: 'Rp 720jt', sub: 'Anggaran: Rp 850jt' },
          { label: 'Manpower', value: '24 Orang', sub: 'Aktif hari ini' },
          { label: 'Sisa Waktu', value: '190 Hari', sub: 'Deadline: 30 Sep 2026' },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline Chart */}
        <div className="lg:col-span-2">
          <TimelineChart />
        </div>

        {/* Input Progress */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Input Progress</h3>
          <form onSubmit={handleProgressSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Persentase (%)</label>
              <input
                type="number" min="0" max="100"
                value={progressForm.persen}
                onChange={(e) => setProgressForm({ ...progressForm, persen: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0 - 100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Kendala</label>
              <input
                type="text"
                value={progressForm.kendala}
                onChange={(e) => setProgressForm({ ...progressForm, kendala: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Kendala di lapangan..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Catatan</label>
              <textarea
                rows={3}
                value={progressForm.catatan}
                onChange={(e) => setProgressForm({ ...progressForm, catatan: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Catatan tambahan..."
              />
            </div>
            <button type="submit" className="btn-primary w-full">Simpan Progress</button>
          </form>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Detail Budget & Material</h3>
        <ProgressBar label="Sipil & Struktur"   value={320} target={400} color="bg-blue-500" />
        <ProgressBar label="MEP"                value={210} target={250} color="bg-green-500" />
        <ProgressBar label="Finishing"          value={130} target={150} color="bg-yellow-500" />
        <ProgressBar label="Peralatan Medis"    value={60}  target={50}  color="bg-red-400" />
      </div>

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Dokumen Proyek" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Jenis Dokumen</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Laporan Harian</option>
              <option>Laporan Mingguan</option>
              <option>Foto Pekerjaan</option>
              <option>Dokumen Teknis</option>
            </select>
          </div>
          <FileUpload
            label="Upload Laporan / Foto"
            accept={{ 'image/*': [], 'application/pdf': [] }}
            onFilesChange={(files) => console.log(files)}
          />
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setUploadOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={() => { toast.success('Dokumen berhasil diupload'); setUploadOpen(false) }} className="btn-primary">
              Upload
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
