import DataTable from '../components/ui/DataTable'

const MOCK_LOGS = [
  { user: 'Budi Santoso', role: 'Project Manager', action: 'Upload laporan harian', project: 'RS Sentral Amsar', time: '23 Mar 2026 08:32' },
  { user: 'Siti Rahayu', role: 'Engineer', action: 'Input progress 45%', project: 'Klinik Utama Barat', time: '23 Mar 2026 07:15' },
  { user: 'Ahmad Fauzi', role: 'Engineer', action: 'Upload foto pekerjaan', project: 'Lab Medis Timur', time: '22 Mar 2026 17:40' },
  { user: 'Dewi Lestari', role: 'Project Manager', action: 'Update budget realisasi', project: 'Apotek Cabang 3', time: '22 Mar 2026 14:20' },
  { user: 'Direktur', role: 'Direktur', action: 'Lihat laporan overview', project: '-', time: '22 Mar 2026 10:00' },
]

const columns = [
  { key: 'user', label: 'Pengguna', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
  { key: 'role', label: 'Role' },
  { key: 'action', label: 'Aktivitas' },
  { key: 'project', label: 'Proyek' },
  { key: 'time', label: 'Waktu' },
]

export default function ActivityLogPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={MOCK_LOGS} />
      </div>
    </div>
  )
}
