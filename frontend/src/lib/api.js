const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem('amsar-auth') || '{}')?.state?.token
  } catch { return null }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(method, path, body = null, isFormData = false) {
  const token = getToken()
  const headers = { Accept: 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData && body) headers['Content-Type'] = 'application/json'

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : null),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Server error' }))
      throw new ApiError(
        errorData.message || `HTTP ${res.status}`,
        res.status,
        errorData
      )
    }

    return res.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      null
    )
  }
}

export const api = {
  // Auth
  login:  (data)  => request('POST', '/auth/login', data),
  logout: ()      => request('POST', '/auth/logout'),
  me:     ()      => request('GET',  '/auth/me'),

  // Projects
  getProjects:     ()       => request('GET',    '/projects'),
  getProject:      (id)     => request('GET',    `/projects/${id}`),
  createProject:   (data)   => request('POST',   '/projects', data),
  updateProject:   (id, d)  => request('PUT',    `/projects/${id}`, d),
  completeProject: (id, note) => request('POST', `/projects/${id}/complete`, { note }),
  deleteProject:   (id)     => request('DELETE', `/projects/${id}`),
  restoreProject:  (id)     => request('POST',   `/projects/${id}/restore`),
  getTrash:        ()       => request('GET',    '/projects/trash'),
  getKpi:          ()       => request('GET',    '/projects/kpi'),

  // Materials
  getMaterials:    (pid)          => request('GET',    `/projects/${pid}/materials`),
  addMaterial:     (pid, data)    => request('POST',   `/projects/${pid}/materials`, data),
  updateMaterial:  (pid, mid, d)  => request('PUT',    `/projects/${pid}/materials/${mid}`, d),
  deleteMaterial:  (pid, mid)     => request('DELETE', `/projects/${pid}/materials/${mid}`),

  // Documents
  getDocuments:    (pid)    => request('GET',    `/documents${pid ? `?project_id=${pid}` : ''}`),
  uploadDocument:  (form)   => request('POST',   '/documents', form, true),
  deleteDocument:  (id)     => request('DELETE', `/documents/${id}`),

  // Notifications
  getNotifications:  ()    => request('GET',  '/notifications'),
  markNotifRead:     (id)  => request('POST', `/notifications/${id}/read`),
  markAllNotifRead:  ()    => request('POST', '/notifications/mark-all-read'),
  deleteNotif:       (id)  => request('DELETE', `/notifications/${id}`),
  clearAllNotif:     ()    => request('DELETE', '/notifications'),

  // Activity Log
  getActivityLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/activity-logs${q ? '?'+q : ''}`)
  },

  // Users
  getUsers:       ()        => request('GET',    '/users'),
  createUser:     (data)    => request('POST',   '/users', data),
  updateUser:     (id, d)   => request('PUT',    `/users/${id}`, d),
  deleteUser:     (id)      => request('DELETE', `/users/${id}`),
  assignProject:  (uid, pid) => request('POST',  `/users/${uid}/assign-project`, { project_id: pid }),

  // Locations
  getLocations:   (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/locations${q ? '?'+q : ''}`)
  },
  getProvinces:   ()        => request('GET',    '/locations/provinces'),
}
