import { AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react'
import clsx from 'clsx'

const NOTIFS = [
  { id: 1, type: 'danger',  icon: AlertTriangle, title: 'Over Budget!', message: 'Klinik Utama Barat melebihi anggaran sebesar Rp 10jt', time: '2 jam lalu', read: false },
  { id: 2, type: 'warning', icon: Clock,         title: 'Mendekati Deadline', message: 'Apotek Cabang 3 deadline dalam 39 hari, progress baru 30%', time: '5 jam lalu', read: false },
  { id: 3, type: 'success', icon: CheckCircle,   title: 'Milestone Tercapai', message: 'Lab Medis Timur mencapai 88% progress', time: '1 hari lalu', read: true },
  { id: 4, type: 'info',    icon: Info,          title: 'Dokumen Baru', message: 'Laporan mingguan W12 telah diupload oleh Siti R.', time: '1 hari lalu', read: true },
]

const typeStyle = {
  danger:  { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
  warning: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'border-yellow-100' },
  success: { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100' },
  info:    { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
}

export default function NotificationsPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
        <button className="text-xs text-blue-600 hover:underline">Tandai semua dibaca</button>
      </div>
      <div className="space-y-3">
        {NOTIFS.map((n) => {
          const s = typeStyle[n.type]
          const Icon = n.icon
          return (
            <div key={n.id} className={clsx('flex gap-4 p-4 rounded-xl border', s.bg, s.border, !n.read && 'ring-1 ring-offset-1 ring-blue-200')}>
              <div className={clsx('mt-0.5 shrink-0', s.icon)}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
