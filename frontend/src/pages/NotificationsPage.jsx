import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, CheckCircle, Info, Bell, Trash2, CheckCheck, MapPin, TrendingUp, XCircle, UserCheck } from '@icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import useAppStore from '../store/appStore'
import toast from 'react-hot-toast'

// â”€â”€â”€ Type config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TYPE_CONFIG = {
  success:          { Icon: CheckCircle,  bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500', label: 'Selesai' },
  over_budget:      { Icon: XCircle,      bg: 'bg-red-50',     iconBg: 'bg-red-100',     iconColor: 'text-red-600',     border: 'border-red-100',     dot: 'bg-red-500',     label: 'Peringatan' },
  deadline_warning: { Icon: AlertTriangle, bg: 'bg-amber-50',  iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   border: 'border-amber-100',   dot: 'bg-amber-500',   label: 'Deadline' },
  info:             { Icon: Info,          bg: 'bg-blue-50',   iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    border: 'border-blue-100',    dot: 'bg-blue-500',    label: 'Info' },
  visit:            { Icon: MapPin,        bg: 'bg-purple-50', iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  border: 'border-purple-100',  dot: 'bg-purple-500',  label: 'Kunjungan' },
  funnel:           { Icon: TrendingUp,    bg: 'bg-rose-50',   iconBg: 'bg-rose-100',    iconColor: 'text-rose-600',    border: 'border-rose-100',    dot: 'bg-rose-500',    label: 'Funnel' },
}

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info

// â”€â”€â”€ Relative time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const relativeTime = (date) => {
  if (!date) return '-'
  const diff = Date.now() - new Date(date)
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  if (hrs < 24)  return `${hrs} jam lalu`
  if (days === 1) return 'Kemarin'
  if (days < 7)  return `${days} hari lalu`
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// â”€â”€â”€ Group by date â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const groupByDate = (list) => {
  const groups = {}
  list.forEach(n => {
    if (!n.createdAt) return
    const d = new Date(n.createdAt)
    const today = new Date(); today.setHours(0,0,0,0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    d.setHours(0,0,0,0)
    let key
    if (+d === +today) key = 'Hari ini'
    else if (+d === +yesterday) key = 'Kemarin'
    else {
      const days = Math.floor((today - d) / 86400000)
      key = days < 7 ? `${days} hari lalu` : new Date(n.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

export default function NotificationsPage() {
  const { user }    = useAuthStore()
  const setNotifications = useAppStore(state => state.setNotifications)
  const markNotificationReadInStore = useAppStore(state => state.markNotificationReadInStore)
  const markAllNotificationsReadInStore = useAppStore(state => state.markAllNotificationsReadInStore)
  const removeNotificationInStore = useAppStore(state => state.removeNotificationInStore)
  const clearNotificationsInStore = useAppStore(state => state.clearNotificationsInStore)
  const navigate    = useNavigate()
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all') // all | unread | read

  // â”€â”€ Fetch from backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getNotifications()
      const data = Array.isArray(res) ? res : res?.data || []
      setNotifs(data)
      setNotifications(data)
    } catch {
      toast.error('Gagal memuat notifikasi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifs()
    // Auto-refresh every 30s
    const t = setInterval(fetchNotifs, 30000)
    return () => clearInterval(t)
  }, [fetchNotifs])

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      markNotificationReadInStore(id)
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      markAllNotificationsReadInStore()
      toast.success('Semua notifikasi ditandai dibaca')
    } catch {
      toast.error('Gagal menandai semua dibaca')
    }
  }

  const deleteOne = async (id, e) => {
    e.stopPropagation()
    try {
      await api.deleteNotification(id)
      setNotifs(prev => prev.filter(n => n.id !== id))
      removeNotificationInStore(id)
    } catch {
      toast.error('Gagal menghapus notifikasi')
    }
  }

  const clearAll = async () => {
    if (!confirm('Hapus semua notifikasi?')) return
    try {
      await api.clearAllNotifications()
      setNotifs([])
      clearNotificationsInStore()
      toast.success('Semua notifikasi dihapus')
    } catch {
      toast.error('Gagal menghapus semua notifikasi')
    }
  }

  // â”€â”€ Navigate on click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleClick = (n) => {
    markRead(n.id)
    const meta = n.metadata || {}
    if (meta.project_id) { navigate(`/projects/${meta.project_id}`); return }
    if (meta.funnel_id)  { navigate('/funnels'); return }
    const title = (n.title || '').toLowerCase()
    if (title.includes('visit') || title.includes('kunjungan')) { navigate('/realisasi-visits'); return }
    if (title.includes('funnel')) { navigate('/funnels'); return }
  }

  // â”€â”€ Filtered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = notifs.filter(n =>
    filter === 'unread' ? !n.isRead :
    filter === 'read'   ? n.isRead : true
  )
  const grouped   = groupByDate(filtered)
  const groupKeys = Object.keys(grouped).sort((a, b) =>
    a === 'Hari ini' ? -1 : b === 'Hari ini' ? 1 :
    a === 'Kemarin'  ? -1 : b === 'Kemarin'  ? 1 : 0
  )
  const unreadCount = notifs.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 p-6">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <Bell className="text-white" size={20} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? <span className="text-blue-600 font-medium">{unreadCount} belum dibaca</span> : 'Semua sudah dibaca'}
              {' · '}{notifs.length} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <CheckCheck size={14} />
              Tandai semua dibaca
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <Trash2 size={14} />
              Hapus semua
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ Filter tabs â”€â”€ */}
      <div className="flex items-center gap-1 mb-6 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit">
        {[
          { key: 'all', label: 'Semua', count: notifs.length },
          { key: 'unread', label: 'Belum dibaca', count: unreadCount },
          { key: 'read', label: 'Sudah dibaca', count: notifs.length - unreadCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Bell size={36} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {filter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
          </h3>
          <p className="text-sm text-gray-400">
            {filter === 'unread'
              ? 'Semua notifikasi sudah dibaca'
              : 'Notifikasi akan muncul di sini saat ada aktivitas baru dari tim Anda'}
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {groupKeys.map(groupKey => (
            <div key={groupKey}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{groupKey}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">{grouped[groupKey].length} notif</span>
              </div>

              {/* Notif cards */}
              <div className="space-y-2.5">
                {grouped[groupKey].map(n => {
                  const cfg  = getConfig(n.type)
                  const Icon = cfg.Icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`relative rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md group ${cfg.bg} ${cfg.border} ${n.isRead ? 'opacity-70' : ''}`}
                    >
                      {/* Unread indicator */}
                      {!n.isRead && (
                        <span className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${cfg.dot} shadow-sm`} />
                      )}

                      <div className="flex items-start gap-3 pr-6">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                          <Icon size={18} className={cfg.iconColor} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-semibold text-gray-900 leading-snug ${!n.isRead ? 'font-bold' : ''}`}>
                              {n.title}
                            </p>
                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                              {relativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>

                          {/* Type badge */}
                          <div className="flex items-center justify-between mt-2.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${cfg.iconBg} ${cfg.iconColor}`}>
                              {cfg.label}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.isRead && (
                                <button
                                  onClick={e => { e.stopPropagation(); markRead(n.id) }}
                                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 bg-white/80 px-2 py-1 rounded-lg font-medium"
                                >
                                  <UserCheck size={11} />
                                  Baca
                                </button>
                              )}
                              <button
                                onClick={e => deleteOne(n.id, e)}
                                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 bg-white/80 px-2 py-1 rounded-lg"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
