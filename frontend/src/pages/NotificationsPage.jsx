import { AlertTriangle, Clock, CheckCircle, Info, ExternalLink, Mail, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'

const typeStyle = {
  over_budget:      { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100',    Icon: AlertTriangle, label: 'Over Budget' },
  deadline_warning: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'border-yellow-100', Icon: Clock,         label: 'Deadline' },
  success:          { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100',  Icon: CheckCircle,   label: 'Selesai' },
  info:             { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100',   Icon: Info,          label: 'Info' },
}

export default function NotificationsPage() {
  const { notifications, projects, markNotifRead, markAllNotifRead, deleteNotif, clearAllNotif } = useAppStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Calculate unread notifications count
  const unread = notifications?.filter(n => !n.isRead)?.length || 0

  const getStyle = (type) => typeStyle[type] || typeStyle.info

  const getProject = (projectId) => projects.find(p => String(p.id) === String(projectId))

  const handleGmail = (e, pmEmail, projectName, pmName, type, progress, daysLeft) => {
    e.stopPropagation()
    if (!pmEmail) return
    const subject = encodeURIComponent(`[PT Amsar Prima Mandiri] ${type === 'over_budget' ? 'Over Budget' : 'Deadline Warning'} - ${projectName}`)
    const body = encodeURIComponent(
      type === 'over_budget'
        ? `Yth. ${pmName},\n\nProyek "${projectName}" telah melebihi RAB yang telah ditetapkan.\n\nMohon segera ditindaklanjuti dan laporkan kondisi terkini.\n\nSalam,\nPT Amsar Prima Mandiri`
        : `Yth. ${pmName},\n\nProyek "${projectName}" mendekati deadline (${daysLeft} hari lagi) dengan progress saat ini ${progress}%.\n\nMohon segera percepat penyelesaian dan laporkan kendala yang ada.\n\nSalam,\nPT Amsar Prima Mandiri`
    )
    window.open(`https://mail.google.com/mail/?view=cm&to=${pmEmail}&su=${subject}&body=${body}`, '_blank')
  }

  const handleNotificationClick = (notification) => {
    markNotifRead(notification.id)
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'project':
      case 'project_update':
      case 'project_completed':
        if (notification.projectId) {
          navigate(`/projects/${notification.projectId}`)
        } else {
          navigate('/projects')
        }
        break
      case 'attendance':
      case 'attendance_warning':
        navigate('/attendance')
        break
      case 'visit':
      case 'visit_reminder':
      case 'visit_completed':
        navigate('/plan-visits')
        break
      case 'customer':
        navigate('/customers')
        break
      case 'warning':
        navigate('/warnings')
        break
      default:
        // For other types, stay on notifications page
        break
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread} belum dibaca</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={markAllNotifRead} className="text-xs text-blue-600 hover:underline">
              Tandai semua dibaca
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAllNotif} className="text-xs text-red-500 hover:underline">
              Hapus semua
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Info size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const s = getStyle(n.type)
            const Icon = s.Icon
            const project = getProject(n.projectId)
            const pmEmail = project?.phone // field phone kita pakai untuk email PM

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={clsx(
                  'rounded-xl border p-4 transition-opacity cursor-pointer hover:bg-gray-50',
                  s.bg, s.border,
                  n.isRead && 'opacity-60'
                )}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={clsx('mt-0.5 shrink-0', s.icon)}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                    {project && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Proyek: {project.name} · SM: {project.pm}
                        {pmEmail && <span className="ml-1 text-gray-400">({pmEmail})</span>}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 ml-7">
                  {project && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markNotifRead(n.id); navigate(`/projects/${project.id}`) }}
                      className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <ExternalLink size={12} /> Lihat Proyek
                    </button>
                  )}
                  {pmEmail && (user?.role === 'administrator' || user?.role === 'direktur') && n.type !== 'success' && (
                    <button
                      onClick={(e) => handleGmail(e, pmEmail, project?.name, project?.pm, n.type, project?.progress, Math.ceil((new Date(project?.deadline) - new Date()) / 86400000))}
                      className="flex items-center gap-1.5 text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <Mail size={12} /> Hubungi SM via Gmail
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                    className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
