import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generate notifikasi otomatis dari data proyek
export const generateProjectNotifs = () => {
  try {
    const projects = JSON.parse(localStorage.getItem('projects_data') || '[]')
    const notifs = []
    const now = new Date()

    projects.forEach(p => {
      if (p.status === 'completed') return

      // Over budget
      if (p.realisasi > p.rab) {
        notifs.push({
          id: `overbudget_${p.id}`,
          type: 'danger',
          category: 'budget',
          title: 'Over Budget!',
          message: `${p.name} melebihi anggaran sebesar Rp ${p.realisasi - p.rab}jt`,
          project: p.name,
          time: now.toISOString(),
          read: false,
          auto: true,
        })
      }

      // Deadline mepet (< 60 hari) dan progress rendah
      const daysLeft = Math.ceil((new Date(p.deadline) - now) / 86400000)
      if (daysLeft > 0 && daysLeft <= 60 && p.progress < 70) {
        notifs.push({
          id: `deadline_${p.id}`,
          type: 'warning',
          category: 'deadline',
          title: 'Mendekati Deadline',
          message: `${p.name} deadline dalam ${daysLeft} hari, progress baru ${p.progress}%`,
          project: p.name,
          time: now.toISOString(),
          read: false,
          auto: true,
        })
      }

      // Deadline terlewat
      if (daysLeft < 0 && p.status !== 'completed') {
        notifs.push({
          id: `overdue_${p.id}`,
          type: 'danger',
          category: 'deadline',
          title: 'Deadline Terlewat!',
          message: `${p.name} sudah melewati deadline ${Math.abs(daysLeft)} hari yang lalu`,
          project: p.name,
          time: now.toISOString(),
          read: false,
          auto: true,
        })
      }

      // Progress milestone
      if (p.progress >= 75 && p.progress < 100) {
        notifs.push({
          id: `milestone_${p.id}`,
          type: 'success',
          category: 'progress',
          title: 'Milestone Tercapai',
          message: `${p.name} mencapai ${p.progress}% progress`,
          project: p.name,
          time: now.toISOString(),
          read: false,
          auto: true,
        })
      }
    })

    return notifs
  } catch { return [] }
}

const useNotifStore = create(
  persist(
    (set, get) => ({
      notifs: [],
      lastGenerated: null,

      // merge notif auto dari proyek + notif manual
      syncFromProjects: () => {
        const autoNotifs = generateProjectNotifs()
        const current = get().notifs
        // pertahankan status read dari notif yang sudah ada
        const readMap = Object.fromEntries(current.map(n => [n.id, n.read]))
        const merged = autoNotifs.map(n => ({ ...n, read: readMap[n.id] ?? false }))
        // tambahkan notif manual (non-auto) yang masih ada
        const manual = current.filter(n => !n.auto)
        set({ notifs: [...merged, ...manual], lastGenerated: Date.now() })
      },

      addNotif: (notif) => set(s => ({
        notifs: [{ id: Date.now(), time: new Date().toISOString(), read: false, ...notif }, ...s.notifs]
      })),

      markRead: (id) => set(s => ({
        notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n)
      })),

      markAllRead: () => set(s => ({
        notifs: s.notifs.map(n => ({ ...n, read: true }))
      })),

      deleteNotif: (id) => set(s => ({
        notifs: s.notifs.filter(n => n.id !== id)
      })),

      unreadCount: () => get().notifs.filter(n => !n.read).length,
    }),
    { name: 'amsar-notifs' }
  )
)

export default useNotifStore
