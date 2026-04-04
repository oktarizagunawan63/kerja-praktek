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
        const newId = Date.now()
        const newProject = { ...project, id: newId, progress: 0, realisasi: 0, status: project.status || 'on_track', completedAt: null }
        set(s => ({ projects: [newProject, ...s.projects] }))
        
        // Add activity log
        get().addActivity({ 
          action: 'Proyek Dibuat', 
          detail: `Proyek baru "${project.name}" di ${project.location} — PM: ${project.pm}`, 
          projectId: newId 
        })
        
        // Add notification
        get().addNotif({
          type: 'success',
          title: 'Proyek Baru Dibuat ✓',
          message: `${project.name} (${project.location}) telah ditambahkan ke sistem`,
          projectId: newId,
        })
        
        setTimeout(() => get().checkNotifications(), 0)
        return newId
      },

      updateProject: (id, fields) => {
        const project = get().projects.find(p => String(p.id) === String(id))
        if (!project) return
        
        set(s => ({ projects: s.projects.map(p => String(p.id) === String(id) ? { ...p, ...fields } : p) }))
        
        // Add activity log for project updates
        const changes = Object.keys(fields).map(key => {
          if (key === 'name') return `Nama: ${fields[key]}`
          if (key === 'location') return `Lokasi: ${fields[key]}`
          if (key === 'pm') return `PM: ${fields[key]}`
          if (key === 'deadline') return `Deadline: ${new Date(fields[key]).toLocaleDateString('id-ID')}`
          if (key === 'rab') return `RAB: Rp ${fields[key].toLocaleString('id-ID')}`
          if (key === 'status') return `Status: ${fields[key]}`
          return `${key}: ${fields[key]}`
        }).join(', ')
        
        get().addActivity({ 
          action: 'Proyek Diupdate', 
          detail: `Update ${project.name} — ${changes}`, 
          projectId: id 
        })
      },

      // ── Trash / Recycle Bin ───────────────────────────────────────
      trash: [], // proyek yang dihapus sementara

      moveToTrash: (id) => {
        const project = get().projects.find(p => String(p.id) === String(id))
        if (!project) return
        set(s => ({
          projects: s.projects.filter(p => String(p.id) !== String(id)),
          trash: [{ ...project, deletedAt: new Date().toISOString() }, ...s.trash],
        }))
        
        // Add activity log
        get().addActivity({ 
          action: 'Proyek Dihapus', 
          detail: `${project.name} (${project.location}) dipindahkan ke sampah`, 
          projectId: id 
        })
      },

      restoreFromTrash: (id) => {
        const project = get().trash.find(p => String(p.id) === String(id))
        if (!project) return
        const { deletedAt, ...restored } = project
        set(s => ({
          trash: s.trash.filter(p => String(p.id) !== String(id)),
          projects: [restored, ...s.projects],
        }))
        
        // Add activity log
        get().addActivity({ 
          action: 'Proyek Dipulihkan', 
          detail: `${project.name} (${project.location}) dipulihkan dari sampah`, 
          projectId: id 
        })
      },

      deletePermanent: (id) => {
        const project = get().trash.find(p => String(p.id) === String(id))
        set(s => ({ trash: s.trash.filter(p => String(p.id) !== String(id)) }))
        
        // Add activity log
        if (project) {
          get().addActivity({ 
            action: 'Proyek Dihapus Permanen', 
            detail: `${project.name} (${project.location}) dihapus permanen dari sistem`, 
            projectId: id 
          })
        }
      },

      emptyTrash: () => {
        const trashCount = get().trash.length
        set({ trash: [] })
        
        // Add activity log
        if (trashCount > 0) {
          get().addActivity({ 
            action: 'Sampah Dikosongkan', 
            detail: `${trashCount} proyek dihapus permanen dari sampah`, 
            projectId: null 
          })
        }
      },

      deleteProject: (id) => get().moveToTrash(id),

      markComplete: (id, note = '') => {
        const project = get().projects.find(p => String(p.id) === String(id))
        set(s => ({ projects: s.projects.map(p => String(p.id) === String(id) ? { ...p, status: 'completed', progress: 100, completedAt: new Date().toISOString().split('T')[0] } : p) }))
        get().addActivity({ action: 'Proyek Selesai', detail: `Proyek ditandai selesai${note ? ' — ' + note : ''}`, projectId: id })
        if (project) {
          get().addNotif({
            type: 'success',
            title: 'Proyek Selesai ✓',
            message: `${project.name} (${project.location}) telah ditandai selesai${note ? ' — ' + note : ''}`,
            projectId: id,
          })
        }
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
        
        // Check if material is completed and add notification
        const updatedMat = updated.find(m => m.id === matId)
        const project = get().projects.find(p => String(p.id) === String(projectId))
        
        if (updatedMat && project) {
          const percentage = (updatedMat.qty_terpasang / updatedMat.qty_plan) * 100
          
          if (percentage >= 100) {
            get().addNotif({
              type: 'success',
              title: 'Material Selesai ✓',
              message: `${updatedMat.name} di ${project.name} telah terpasang 100%`,
              projectId,
            })
          } else if (percentage >= 90) {
            get().addNotif({
              type: 'warning',
              title: 'Material Hampir Selesai',
              message: `${updatedMat.name} di ${project.name} sudah ${Math.round(percentage)}%`,
              projectId,
            })
          }
        }
      },

      deleteMaterial: (projectId, matId) => {
        const pid = String(projectId)
        const current = get().materials[pid] || []
        const material = current.find(m => m.id === matId)
        get().setMaterials(pid, current.filter(m => m.id !== matId))
        
        // Add activity log
        if (material) {
          get().addActivity({ 
            action: 'Hapus Material', 
            detail: `${material.name} (${material.qty_plan} ${material.unit}) dihapus`, 
            projectId 
          })
        }
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
        
        // Add notification for important document uploads
        const project = get().projects.find(p => String(p.id) === String(doc.projectId))
        if (project && ['kontrak', 'rab', 'izin'].some(type => doc.type.toLowerCase().includes(type))) {
          get().addNotif({
            type: 'info',
            title: 'Dokumen Penting Diupload',
            message: `${doc.type}: ${doc.name} untuk proyek ${project.name}`,
            projectId: doc.projectId,
          })
        }
        
        return newDoc
      },

      deleteDoc: (docId) => {
        const doc = get().documents.find(d => d.id === docId)
        set(s => ({ documents: s.documents.filter(d => d.id !== docId) }))
        if (doc) get().addActivity({ action: 'Hapus Dokumen', detail: `Hapus: ${doc.name}`, projectId: doc.projectId })
      },

      // ── Activity Log ──────────────────────────────────────────
      activities: [],

      addActivity: ({ action, detail, projectId, actorRole }) => {
        const auth = JSON.parse(localStorage.getItem('amsar-auth') || '{}')
        const user = auth?.state?.user
        const project = get().projects.find(p => String(p.id) === String(projectId))
        const entry = {
          id: Date.now(),
          user: user?.name || 'Unknown',
          role: user?.role || '-',
          action,
          detail,
          project: project?.name || '-',
          time: new Date().toLocaleString('id-ID'),
        }
        set(s => ({ activities: [entry, ...s.activities].slice(0, 100) }))

        // Notif ke site manager kalau yang aksi adalah engineer
        if ((user?.role === 'engineer' || actorRole === 'engineer') && project) {
          const notifMsg = `${user?.name || 'Engineer'}: ${action} — ${detail}`
          get().addNotif({
            type: 'info',
            title: `Aktivitas Engineer di ${project.name}`,
            message: notifMsg,
            projectId,
          })
        }
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
      partialize: (state) => ({
        projects: state.projects,
        trash: state.trash,
        materials: state.materials,
        activities: state.activities,
        notifications: state.notifications,
        documents: state.documents, // simpan lengkap termasuk previewUrl
      }),
    }
  )
)

export default useAppStore
