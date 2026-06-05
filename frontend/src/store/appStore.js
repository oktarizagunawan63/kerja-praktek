import { create } from 'zustand'

const API_BASE = 'http://127.0.0.1:8000/api'

// Helper function to get auth token from zustand persist storage
const getAuthToken = () => {
  try {
    const authData = localStorage.getItem('amsar-auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.token || null
    }
  } catch (error) {
    console.error('Failed to get auth token:', error)
  }
  return null
}

const useAppStore = create((set, get) => ({
  // Projects state
  projects: [],
  projectsLoading: false,
  projectsError: null,

  // Trash state
  trash: [],

  // Notifications state (default empty to prevent undefined errors)
  notifications: [],
  notificationUnreadCount: 0,

  // Documents state
  documents: [],
  documentsLoading: false,

  // Materials state
  materials: [],
  materialsLoading: false,

  // Fetch projects directly from Laravel
  fetchProjects: async () => {
    set({ projectsLoading: true, projectsError: null })
    
    try {
      const token = getAuthToken()
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/projects`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      set({ 
        projects: data.data || [], 
        projectsLoading: false 
      })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      set({ 
        projectsError: error.message, 
        projectsLoading: false,
        projects: []
      })
    }
  },

  // Create project
  createProject: async (projectData) => {
    try {
      const token = getAuthToken()
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Refresh projects list
      get().fetchProjects()
      
      return data
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  },

  // Update project
  updateProject: async (id, projectData) => {
    try {
      const token = getAuthToken()
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(projectData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Refresh projects list
      get().fetchProjects()
      
      return data
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  },

  // Delete project
  deleteProject: async (id) => {
    try {
      const token = getAuthToken()
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Refresh projects list
      get().fetchProjects()
      
      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  },

  // Fetch documents from API
  fetchDocuments: async (params = {}) => {
    set({ documentsLoading: true })
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE}/documents${queryString ? '?' + queryString : ''}`, { headers })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      set({ documents: Array.isArray(data) ? data : [], documentsLoading: false })
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      set({ documents: [], documentsLoading: false })
    }
  },

  fetchMaterials: async (params = {}) => {
    set({ materialsLoading: true })
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE}/materials${queryString ? '?' + queryString : ''}`, { headers })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      set({ materials: Array.isArray(data) ? data : [], materialsLoading: false })
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      set({ materials: [], materialsLoading: false })
      return []
    }
  },

  // Fetch soft-deleted projects from Laravel
  fetchTrash: async () => {
    try {
      const token = getAuthToken()
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/projects/trash`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      set({ trash: data.data || data || [] })
    } catch (error) {
      console.error('Failed to fetch deleted projects:', error)
      set({ trash: [] })
    }
  },

  getDocs: (projectId) =>
    get().documents.filter(d => String(d.projectId) === String(projectId)),

  getMaterials: (projectId) =>
    get().materials.filter(m => String(m.projectId) === String(projectId)),

  // Upload a document (pass FormData with project_id, type, file)
  addDoc: async (formData) => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!response.ok) {
        const d = await response.json().catch(() => ({}))
        throw { message: d.message || `HTTP ${response.status}`, errors: d.errors || {}, status: response.status }
      }
      const newDoc = await response.json()
      set(state => ({ documents: [newDoc, ...state.documents.filter(d => d.id !== newDoc.id)] }))
      return newDoc
    } catch (error) {
      console.error('Failed to upload document:', error)
      throw error
    }
  },

  // Delete a document by ID
  deleteDoc: async (id) => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE', headers })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      set(state => ({ documents: state.documents.filter(d => d.id !== id) }))
      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  },

  addMaterial: async (projectId, materialData) => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/materials`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_id: projectId,
          ...materialData,
        }),
      })
      if (!response.ok) {
        const d = await response.json().catch(() => ({}))
        throw { message: d.message || `HTTP ${response.status}`, errors: d.errors || {}, status: response.status }
      }
      const newMaterial = await response.json()
      set(state => ({
        materials: [
          ...state.materials.filter(m => m.id !== newMaterial.id),
          { ...newMaterial, projectId: String(projectId) },
        ],
      }))
      get().fetchProjects()
      return { ...newMaterial, projectId: String(projectId) }
    } catch (error) {
      console.error('Failed to create material:', error)
      throw error
    }
  },

  updateMaterialQty: async (projectId, materialId, qty, catatan = '') => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/materials/${materialId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          project_id: projectId,
          qty_terpasang: qty,
          catatan,
        }),
      })
      if (!response.ok) {
        const d = await response.json().catch(() => ({}))
        throw { message: d.message || `HTTP ${response.status}`, errors: d.errors || {}, status: response.status }
      }
      const updatedMaterial = await response.json()
      set(state => ({
        materials: state.materials.map(material =>
          material.id === materialId
            ? { ...updatedMaterial, projectId: String(projectId) }
            : material
        ),
      }))
      get().fetchProjects()
      return { ...updatedMaterial, projectId: String(projectId) }
    } catch (error) {
      console.error('Failed to update material:', error)
      throw error
    }
  },

  deleteMaterial: async (projectId, materialId) => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/materials/${materialId}`, {
        method: 'DELETE',
        headers,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      set(state => ({
        materials: state.materials.filter(material => material.id !== materialId),
      }))
      get().fetchProjects()
      return true
    } catch (error) {
      console.error('Failed to delete material:', error)
      throw error
    }
  },

  // Notifications
  setNotifications: (notifications) => {
    const list = Array.isArray(notifications) ? notifications : []
    set({
      notifications: list,
      notificationUnreadCount: list.filter(notification => !notification.isRead).length,
    })
  },

  markNotificationReadInStore: (id) => {
    set(state => ({
      notifications: state.notifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
      notificationUnreadCount: Math.max(0, state.notificationUnreadCount - 1),
    }))
  },

  markAllNotificationsReadInStore: () => {
    set(state => ({
      notifications: state.notifications.map(notification => ({ ...notification, isRead: true })),
      notificationUnreadCount: 0,
    }))
  },

  removeNotificationInStore: (id) => {
    set(state => ({
      notifications: state.notifications.filter(notification => notification.id !== id),
      notificationUnreadCount: Math.max(
        0,
        state.notificationUnreadCount - (state.notifications.find(notification => notification.id === id && !notification.isRead) ? 1 : 0)
      ),
    }))
  },

  clearNotificationsInStore: () => {
    set({ notifications: [], notificationUnreadCount: 0 })
  },

  checkNotifications: async () => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${API_BASE}/notifications/unread-count`, { headers })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      set({ notificationUnreadCount: Number(data.count || 0) })
    } catch (error) {
      console.error('Failed to check notifications:', error)
    }
  },

  fetchNotifications: async () => get().checkNotifications(),

  // Backward-compatible alias used by older pages
  addProject: async (projectData) => {
    try {
      const response = await get().createProject(projectData)
      return response?.data?.id || response?.id || null
    } catch (error) {
      console.error('Failed to add project:', error)
      return null
    }
  },

  // Mark project as complete
  markComplete: async (projectId, note = '') => {
    try {
      const token = getAuthToken()
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/projects/${projectId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ note }),
      })
      if (!response.ok) {
        const d = await response.json().catch(() => ({}))
        throw new Error(d.message || `HTTP ${response.status}`)
      }
      await get().fetchProjects()
      return true
    } catch (error) {
      console.error('Failed to mark project complete:', error)
      throw error
    }
  },

  // Restore project from trash
  restoreFromTrash: async (projectId) => {
    try {
      const token = getAuthToken()
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/projects/${projectId}/restore`, {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await get().fetchProjects()
      await get().fetchTrash()
      return true
    } catch (error) {
      console.error('Failed to restore project:', error)
      throw error
    }
  },

  // Permanently delete project
  deletePermanent: (projectId) => {
    set(state => ({
      trash: state.trash.filter(p => p.id !== projectId)
    }))
  },

  // Empty trash
  emptyTrash: () => {
    set({ trash: [] })
  },

  // Activity log (no-op stub - kept for backwards compat with ProjectsPage)
  addActivity: (_activity) => {
    // Activities are logged server-side via ActivityLogger; no local state needed.
  },
}))

export default useAppStore
