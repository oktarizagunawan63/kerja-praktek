import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, Info, Trash2, BellOff, ExternalLink, MessageCircle, X } from 'lucide-react'
import clsx from 'clsx'
import useNotifStore from '../store/notifStore'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const typeStyle = {
  danger:  { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100',    Icon: AlertTriangle },
  warning: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'border-yellow-100', Icon: Clock },
  success: { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100',  Icon: CheckCircle },
  info:    { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100',   Icon: Info },
}

const formatTime = (iso) => {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: id }) }
  catch { return '-' }
}

// Cari project id dari nama
const findProjectId = (projectName) => {
  try {
    const all = JSON.parse(localStorage.getItem('projects_data') || '[]')
    return all.find(p => p.name === projectName)?.id || null
  } catch { return null }
}

// Notif yang butuh action button
const ACTION_CATEGORIES = ['budget', 'deadline']

export default function NotificationsPage() {
  const { notifs, syncFromProjects, markRead, markAllRead, deleteNotif } = useNotifStore()
  const navigate = useNavigate()
  const [chatModal, setChatModal] = useState(null) // { project, pm }
  const [chatMsg, setChatMsg] = useState('')
  const [chatSent, setChatSent] = useState(false)
  const [chatPhone, setChatPhone] = useState('')

  useEffect(() => { syncFromProjects() }, [])

  const unread = notifs.filter(n => !n.read).length

  const handleLihatDetail = (e, n) => {
    e.stopPropagation()
    markRead(n.id)
    const pid = findProjectId(n.project)
    if (pid) navigate(`/projects/${pid}`)
    else navigate('/projects')
  }

  const handleChatPM = (e, n) => {
    e.stopPropagation()
    markRead(n.id)
    try {
      const all = JSON.parse(localStorage.getItem('projects_data') || '[]')
      const proj = all.find(p => p.name === n.project)
      const phone = proj?.phone?.replace(/\D/g, '')

      if (phone) {
        const msg = encodeURIComponent(
          `Halo ${proj.pm}, saya ingin menindaklanjuti terkait proyek *${n.project}*:\n\n_${n.message}_\n\nMohon segera ditangani. Terima kasih.`
        )
        window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank')
      } else {
        // Nomor belum ada — buka modal dengan input nomor
        setChatModal({ project: n.project, pm: proj?.pm || 'Project Manager', issue: n.message, needPhone: true })
        setChatSent(false)
        setChatMsg('')
        setChatPhone('')
      }
    } catch {
      setChatModal({ project: n.project, pm: 'Project Manager', issue: n.message, needPhone: true })
    }
  }

  const handleSendChat = () => {
    const phone = chatPhone.replace(/\D/g, '') || chatModal.phone?.replace(/\D/g, '')
    if (!chatMsg.trim()) return

    if (phone) {
      // Simpan nomor ke proyek kalau belum ada
      if (chatModal.needPhone && phone) {
        try {
          const all = JSON.parse(localStorage.getItem('projects_data') || '[]')
          const updated = all.map(p => p.name === chatModal.project ? { ...p, phone } : p)
          localStorage.setItem('projects_data', JSON.stringify(updated))
        } catch {}
      }
      const msg = encodeURIComponent(
        `Halo ${chatModal.pm}, saya ingin menindaklanjuti terkait proyek *${chatModal.project}*:\n\n_${chatModal.issue}_\n\n${chatMsg}\n\nTerima kasih.`
      )
      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank')
      setChatSent(true)
    } else {
      // Simpan ke activity log kalau ga ada nomor
      const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]')
      logs.unshift({
        id: Date.now(), user: 'Direktur Utama', role: 'Director',
        action: 'Pesan ke PM', detail: `[Ke ${chatModal.pm}] ${chatMsg}`,
        project: chatModal.project, time: new Date().toLocaleString('id-ID'),
      })
      localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 50)))
      setChatSent(true)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
            Tandai semua dibaca
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <BellOff size={36} className="mb-3 opacity-40" />
          <p className="text-sm">Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => {
            const s = typeStyle[n.type] || typeStyle.info
            const Icon = s.Icon
            const showActions = ACTION_CATEGORIES.includes(n.category) && n.project
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={clsx(
                  'flex gap-4 p-4 rounded-xl border transition-all',
                  s.bg, s.border,
                  !n.read && 'ring-1 ring-offset-1 ring-blue-200 shadow-sm',
                  n.read && 'opacity-75'
                )}
              >
                <div className={clsx('mt-0.5 shrink-0', s.icon)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      {n.project && (
                        <p className="text-xs text-gray-400 mt-0.5">Proyek: {n.project}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatTime(n.time)}</p>

                      {/* Action buttons untuk budget & deadline */}
                      {showActions && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => handleLihatDetail(e, n)}
                            className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <ExternalLink size={12} /> Lihat Detail
                          </button>
                          <button
                            onClick={(e) => handleChatPM(e, n)}
                            className="flex items-center gap-1.5 text-xs bg-[#0f4c81] text-white hover:bg-[#1a6bb5] px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <MessageCircle size={12} /> Chat SM
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                        className="p-1 hover:bg-black/10 rounded text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Chat PM Modal */}
      {chatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 isolate">
          <div className="absolute inset-0 bg-black/50" onClick={() => setChatModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">Chat ke SM: {chatModal.pm}</p>
                <p className="text-xs text-gray-400">{chatModal.project}</p>
              </div>
              <button onClick={() => setChatModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Context issue */}
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700 font-medium">Terkait:</p>
                <p className="text-xs text-amber-600 mt-0.5">{chatModal.issue}</p>
              </div>

              {chatSent ? (
                <div className="flex flex-col items-center py-6 gap-2 text-green-600">
                  <CheckCircle size={32} />
                  <p className="text-sm font-semibold">WhatsApp dibuka</p>
                  <p className="text-xs text-gray-400">Pesan sudah siap dikirim di WhatsApp</p>
                  <button onClick={() => setChatModal(null)} className="mt-2 text-xs text-[#0f4c81] hover:underline">
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  {chatModal.needPhone && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        No. WhatsApp Site Manager <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={chatPhone}
                        onChange={e => setChatPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="628xxxxxxxxxx"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 mt-1">Nomor akan disimpan untuk proyek ini</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Pesan tambahan (opsional)</label>
                    <textarea
                      rows={3}
                      value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder={`Tulis pesan untuk SM ${chatModal.pm}...`}
                      autoFocus={!chatModal.needPhone}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setChatModal(null)} className="btn-secondary text-sm">Batal</button>
                    <button
                      onClick={handleSendChat}
                      disabled={chatModal.needPhone ? !chatPhone.trim() : !chatMsg.trim()}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      <MessageCircle size={14} /> Kirim via WhatsApp
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
