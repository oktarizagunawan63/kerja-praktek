import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
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
  const [search, setSearch]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [filterAction, setFilterAction] = useState('')

  const uniqueActions = useMemo(() => [...new Set(activities.map(a => a.action))].sort(), [activities])

  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = !search ||
        a.user?.toLowerCase().includes(search.toLowerCase()) ||
        a.action?.toLowerCase().includes(search.toLowerCase()) ||
        a.project?.toLowerCase().includes(search.toLowerCase()) ||
        a.detail?.toLowerCase().includes(search.toLowerCase())

      const matchAction = !filterAction || a.action === filterAction

      const actDate = new Date(a.time?.split(', ')[0].split('/').reverse().join('-'))
      const matchFrom = !dateFrom || actDate >= new Date(dateFrom)
      const matchTo   = !dateTo   || actDate <= new Date(dateTo)

      return matchSearch && matchAction && matchFrom && matchTo
    })
  }, [activities, search, filterAction, dateFrom, dateTo])

  const hasFilter = search || filterAction || dateFrom || dateTo

  const reset = () => { setSearch(''); setFilterAction(''); setDateFrom(''); setDateTo('') }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <span className="text-xs text-gray-400">{filtered.length} dari {activities.length} aktivitas</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari user, aktivitas, proyek..."
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-56" />
        </div>

        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Aktivitas</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <span className="text-xs text-gray-400">s/d</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        {hasFilter && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
            <X size={13} /> Reset
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} emptyText="Belum ada aktivitas" />
      </div>
    </div>
  )
}
