import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Central store — single source of truth
 * Semua halaman baca/tulis dari sini
 */
const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Projects ──────────────────────────────────────────────
      projects: [],

      addProject: (project) => {
        set(s => ({ projects: [{ ...project, id: Date.now(), progress: 0, realisasi: 0, status: project.status || 'on_track', completedAt: null }, ...s.projects] }))
        setTimeout(() => get().checkNotifications(), 0)
      },

      updateProject: (id, fields) =>
        set(s => ({ projects: s.projects.map(p => String(p.id) === String(id) ? { ...p, ...fields } : p) })),

      deleteProject: (id) =>
        set(s => ({ projects: s.projects.filter(p => String(p.id) !== String(id)) })),

      markComplete: (id, note = '') => {
        set(s => ({ projects: s.projects.map(p => String(p.id) === String(id) ? { ...p, status: 'completed', progress: 100, completedAt: new Date().toISOString().split('T')[0] } : p) }))
        get().addActivity({ action: 'Proyek Selesai', detail: `Proyek ditandai selesai${note ? ' — ' + note : ''}`, projectId: id })
      },

      // ── Materials per project ──────────────────────────────────
      materials: {}, // { [projectId]: [...] }

      getMaterials: (projectId) => get().materials[String(projectId)] || [],

      setMaterials: (projectId, mats) => {
        const pid = String(projectId)
        const progress = mats.length
          ? Math.round(mats.reduce((s, m) => s + Math.min((m.qty_terpasang / m.qty_plan) * 100, 100), 0) / mats.length)
          : get().projects.find(p => String(p.id) === pid)?.progress || 0
        set(s => ({
          materials: { ...s.materials, [pid]: mats },
          projects: s.projects.map(p => String(p.id) === pid ? { ...p, progress } : p),
        }))
        // Auto check notifikasi setiap ada update material
        setTimeout(() => get().checkNotifications(), 0)
      },

      addMaterial: (projectId, mat) => {
        const pid = String(projectId)
        const current = get().materials[pid] || []
        const newMat = { ...mat, id: Date.now() }
        get().setMaterials(pid, [...current, newMat])
        get().addActivity({ action: 'Tambah Material', detail: `${newMat.name} (${newMat.qty_plan} ${newMat.unit})`, projectId })
        return newMat
      },

      updateMaterialQty: (projectId, matId, qtyTambah, catatan = '') => {
        const pid = String(projectId)
        const current = get().materials[pid] || []
        const mat = current.find(m => m.id === matId)
        if (!mat) return
        const updated = current.map(m => m.id === matId
          ? { ...m, qty_terpasang: Math.min(m.qty_terpasang + qtyTambah, m.qty_plan) }
          : m
        )
        get().setMaterials(pid, updated)
        get().addActivity({ action: 'Update Material Terpasang', detail: `Tambah ${qtyTambah} ${mat.unit} ${mat.name}${catatan ? ' — ' + catatan : ''}`, projectId })
      },

      deleteMaterial: (projectId, matId) => {
        const pid = String(projectId)
        const current = get().materials[pid] || []
        get().setMaterials(pid, current.filter(m => m.id !== matId))
      },

      // ── Documents ─────────────────────────────────────────────
      documents: [], // semua dokumen dari semua proyek

      getDocs: (projectId) => projectId
        ? get().documents.filter(d => String(d.projectId) === String(projectId))
        : get().documents,

      addDoc: (doc) => {
        const newDoc = { ...doc, id: Date.now() }
        set(s => ({ documents: [newDoc, ...s.documents] }))
        get().addActivity({ action: 'Upload Dokumen', detail: `Upload ${doc.type}: ${doc.name}`, projectId: doc.projectId })
        return newDoc
      },

      deleteDoc: (docId) => {
        const doc = get().documents.find(d => d.id === docId)
        set(s => ({ documents: s.documents.filter(d => d.id !== docId) }))
        if (doc) get().addActivity({ action: 'Hapus Dokumen', detail: `Hapus: ${doc.name}`, projectId: doc.projectId })
      },

      // ── Activity Log ──────────────────────────────────────────
      activities: [],

      addActivity: ({ action, detail, projectId }) => {
        const auth = JSON.parse(localStorage.getItem('amsar-auth') || '{}')
        const user = auth?.state?.user
        const project = get().projects.find(p => String(p.id) === String(projectId))
        set(s => ({
          activities: [{
            id: Date.now(),
            user: user?.name || 'Unknown',
            role: user?.role || '-',
            action,
            detail,
            project: project?.name || '-',
            time: new Date().toLocaleString('id-ID'),
          }, ...s.activities].slice(0, 100)
        }))
      },

      // ── Notifications ─────────────────────────────────────────
      notifications: [],

      addNotif: (notif) =>
        set(s => ({ notifications: [{ ...notif, id: Date.now(), isRead: false, createdAt: new Date().toISOString() }, ...s.notifications] })),

      markNotifRead: (id) =>
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) })),

      markAllNotifRead: () =>
        set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })) })),

      deleteNotif: (id) =>
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      clearAllNotif: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter(n => !n.isRead).length,

      // ── Auto check notifications ──────────────────────────────
      checkNotifications: () => {
        const projects = get().projects.filter(p => p.status !== 'completed')
        projects.forEach(p => {
          const daysLeft = Math.ceil((new Date(p.deadline) - new Date()) / 86400000)

          // Over budget — update atau buat baru
          if (p.realisasi > p.rab) {
            const exists = get().notifications.find(n => String(n.projectId) === String(p.id) && n.type === 'over_budget')
            if (!exists) {
              get().addNotif({ type: 'over_budget', title: 'Over Budget!', message: `${p.name} melebihi RAB (Rp ${p.realisasi}jt dari Rp ${p.rab}jt)`, projectId: p.id })
            }
          }

          // Deadline warning — progress < 80% dan deadline <= 30 hari
          if (daysLeft <= 30 && daysLeft > 0 && p.progress < 80) {
            const exists = get().notifications.find(n => String(n.projectId) === String(p.id) && n.type === 'deadline_warning')
            if (exists) {
              // Update message dengan progress terbaru
              set(s => ({ notifications: s.notifications.map(n =>
                n.id === exists.id ? { ...n, message: `${p.name} deadline ${daysLeft} hari lagi, progress ${p.progress}%`, isRead: false } : n
              )}))
            } else {
              get().addNotif({ type: 'deadline_warning', title: 'Mendekati Deadline', message: `${p.name} deadline ${daysLeft} hari lagi, progress ${p.progress}%`, projectId: p.id })
            }
          }
        })
      },
    }),
    {
      name: 'amsar-app',
      // Jangan persist previewUrl base64 yang besar — simpan terpisah
      partialize: (state) => ({
        projects: state.projects,
        materials: state.materials,
        activities: state.activities,
        notifications: state.notifications,
        // documents tanpa previewUrl (disimpan terpisah di localStorage biasa)
        documents: state.documents.map(d => ({ ...d, previewUrl: undefined })),
      }),
    }
  )
)

export default useAppStore
