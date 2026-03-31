import useAppStore from '../store/appStore'
import DataTable from '../components/ui/DataTable'

const columns = [
  { key: 'user',    label: 'Pengguna',  render: (v) => <span className="font-medium text-gray-800">{v}</span> },
  { key: 'role',    label: 'Role' },
  { key: 'action',  label: 'Aktivitas' },
  { key: 'detail',  label: 'Detail' },
  { key: 'project', label: 'Proyek' },
  { key: 'time',    label: 'Waktu' },
]

export default function ActivityLogPage() {
  const { activities } = useAppStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <span className="text-xs text-gray-400">{activities.length} aktivitas tercatat</span>
      </div>
      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={activities} emptyText="Belum ada aktivitas" />
      </div>
    </div>
  )
}
