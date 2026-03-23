import { useState } from 'react'
import { FileText, Image, Download, Eye } from 'lucide-react'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'

const MOCK_DOCS = [
  { id: 1, name: 'Laporan Harian 22 Mar 2026', project: 'RS Sentral Amsar', type: 'Laporan Harian', uploader: 'Budi S.', date: '22 Mar 2026', size: '1.2 MB' },
  { id: 2, name: 'Foto Pekerjaan Lantai 3', project: 'RS Sentral Amsar', type: 'Foto', uploader: 'Ahmad F.', date: '21 Mar 2026', size: '4.5 MB' },
  { id: 3, name: 'Laporan Mingguan W12', project: 'Klinik Utama Barat', type: 'Laporan Mingguan', uploader: 'Siti R.', date: '20 Mar 2026', size: '2.1 MB' },
  { id: 4, name: 'Dokumen Teknis MEP', project: 'Lab Medis Timur', type: 'Dokumen Teknis', uploader: 'Dewi L.', date: '19 Mar 2026', size: '3.8 MB' },
]

const typeVariant = {
  'Laporan Harian': 'info',
  'Laporan Mingguan': 'success',
  'Foto': 'warning',
  'Dokumen Teknis': 'default',
}

const columns = [
  { key: 'name', label: 'Nama File', render: (v, row) => (
    <div className="flex items-center gap-2">
      {row.type === 'Foto' ? <Image size={14} className="text-yellow-500" /> : <FileText size={14} className="text-blue-500" />}
      <span className="font-medium text-gray-800">{v}</span>
    </div>
  )},
  { key: 'project', label: 'Proyek' },
  { key: 'type', label: 'Tipe', render: (v) => <Badge variant={typeVariant[v]}>{v}</Badge> },
  { key: 'uploader', label: 'Diupload Oleh' },
  { key: 'date', label: 'Tanggal' },
  { key: 'size', label: 'Ukuran' },
  { key: 'id', label: 'Aksi', render: () => (
    <div className="flex items-center gap-2">
      <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"><Eye size={14} /></button>
      <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600 transition-colors"><Download size={14} /></button>
    </div>
  )},
]

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const filtered = MOCK_DOCS.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dokumen Proyek</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari dokumen..."
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
        />
      </div>
      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  )
}
