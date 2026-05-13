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

  // Documents state
  documents: [],
  documentsLoading: false,

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
      set(state => ({ documents: [newDoc, ...state.documents] }))
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

  // Check notifications (placeholder - implement when notification system is ready)
  checkNotifications: async () => {
    try {
      set({ notifications: [] })
    } catch (error) {
      console.error('Failed to check notifications:', error)
      set({ notifications: [] })
    }
  },

  // Add project (placeholder - implement when backend ready)
  addProject: async (projectData) => {
    try {
      // For now just add to local state
      const newProject = {
        id: Date.now(),
        ...projectData,
        createdAt: new Date().toISOString()
      }
      set(state => ({ projects: [...state.projects, newProject] }))
      return newProject.id
    } catch (error) {
      console.error('Failed to add project:', error)
      return null
    }
  },

  // Mark project as complete
  markComplete: (projectId) => {
    set(state => ({
      projects: state.projects.map(p => 
        p.id === projectId ? { ...p, status: 'completed', progress: 100 } : p
      )
    }))
  },

  // Restore project from trash
  restoreFromTrash: (projectId) => {
    set(state => {
      const project = state.trash.find(p => p.id === projectId)
      if (!project) return state
      
      const { deletedAt, ...restoredProject } = project
      return {
        trash: state.trash.filter(p => p.id !== projectId),
        projects: [...state.projects, restoredProject]
      }
    })
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

  // Activity log (no-op stub — kept for backwards compat with ProjectsPage)
  addActivity: (_activity) => {
    // Activities are logged server-side via ActivityLogger; no local state needed.
  },
}))

export default useAppStore
