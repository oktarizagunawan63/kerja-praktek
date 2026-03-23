import { useState, useEffect } from 'react'
import DataTable from '../components/ui/DataTable'

const DEFAULT_LOGS = [
  { id: 1, user: 'Budi Santoso', role: 'Project Manager', action: 'Upload Dokumen', detail: 'Upload Laporan Harian: laporan_22mar.pdf', project: 'RS Sentral Amsar', time: '23 Mar 2026 08:32' },
  { id: 2, user: 'Siti Rahayu', role: 'Engineer', action: 'Update Material Terpasang', detail: 'Tambah 50 m3 Beton K-300', project: 'Klinik Utama Barat', time: '23 Mar 2026 07:15' },
  { id: 3, user: 'Ahmad Fauzi', role: 'Engineer', action: 'Upload Dokumen', detail: 'Upload Foto: foto_lantai3.jpg', project: 'Lab Medis Timur', time: '22 Mar 2026 17:40' },
]

const columns = [
  { key: 'user', label: 'Pengguna', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
  { key: 'role', label: 'Role' },
  { key: 'action', label: 'Aktivitas' },
  { key: 'detail', label: 'Detail' },
  { key: 'project', label: 'Proyek' },
  { key: 'time', label: 'Waktu' },
]

export default function ActivityLogPage() {
  const [logs, setLogs] = useState(DEFAULT_LOGS)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('activity_logs') || '[]')
    if (stored.length > 0) {
      setLogs([...stored, ...DEFAULT_LOGS])
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <span className="text-xs text-gray-400">{logs.length} aktivitas tercatat</span>
      </div>
      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={logs} />
      </div>
    </div>
  )
}
