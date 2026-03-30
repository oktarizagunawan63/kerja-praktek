import ManpowerChart from '../components/charts/ManpowerChart'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'

const MOCK_MANPOWER = [
  { name: 'Dr. Hendra K.', role: 'Dokter', project: 'RS Sentral Amsar', status: 'active', since: '01 Jan 2026' },
  { name: 'Ns. Rina M.', role: 'Perawat', project: 'RS Sentral Amsar', status: 'active', since: '01 Jan 2026' },
  { name: 'Teguh P.', role: 'Teknisi MEP', project: 'Klinik Utama Barat', status: 'active', since: '15 Feb 2026' },
  { name: 'Yuni S.', role: 'Admin', project: 'Lab Medis Timur', status: 'inactive', since: '01 Mar 2026' },
  { name: 'Rudi A.', role: 'Supervisor', project: 'Apotek Cabang 3', status: 'active', since: '10 Feb 2026' },
]

const columns = [
  { key: 'name', label: 'Nama', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
  { key: 'role', label: 'Jabatan' },
  { key: 'project', label: 'Proyek' },
  { key: 'since', label: 'Bergabung' },
  { key: 'status', label: 'Status', render: (v) => (
    <Badge variant={v === 'active' ? 'success' : 'default'}>{v === 'active' ? 'Aktif' : 'Tidak Aktif'}</Badge>
  )},
]

export default function ManpowerPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Manpower</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ManpowerChart />
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Daftar Tenaga Kerja</h3>
          </div>
          <DataTable columns={columns} data={MOCK_MANPOWER} />
        </div>
      </div>
    </div>
  )
}
