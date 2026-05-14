const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const pendingGetRequests = new Map()

const normalizeReasonPayload = (reason) => {
  if (typeof reason === 'string') {
    return reason.trim()
  }

  if (reason && typeof reason === 'object') {
    const value = reason.rejection_reason ?? reason.reason ?? ''
    return typeof value === 'string' ? value.trim() : ''
  }

  return ''
}

const getToken = () => {
  try {
    const authData = localStorage.getItem('amsar-auth')
    if (!authData) return null
    const parsed = JSON.parse(authData)
    return parsed?.state?.token || null
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

const request = (endpoint, options = {}) => {
  const { dedupeKey, ...fetchOptions } = options
  const url = `${API_BASE}${endpoint}`
  const token = getToken()
  const method = fetchOptions.method || 'GET'
  const requestKey = dedupeKey
    ? `${method}:${url}:${dedupeKey}:${token || ''}`
    : method === 'GET'
      ? `${method}:${url}:${token || ''}`
      : null
  if (requestKey && pendingGetRequests.has(requestKey)) {
    return pendingGetRequests.get(requestKey)
  }
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...fetchOptions.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const config = {
    ...fetchOptions,
    headers
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, config)
      
      if (response.status === 401) {
        localStorage.removeItem('amsar-auth')
        window.location.href = '/login'
        throw new Error('Session expired. Please login again.')
      }
      
      if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.')
      }
      
      if (response.status === 422) {
        const data = await response.json()
        console.error('Validation errors:', data.errors)
        throw { message: data.message || 'Validation error', errors: data.errors || {}, status: 422 }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API Error [${config.method || 'GET'} ${url}]:`, error)
      throw error
    } finally {
      if (requestKey) {
        pendingGetRequests.delete(requestKey)
      }
    }
  })()

  if (requestKey) {
    pendingGetRequests.set(requestKey, requestPromise)
  }

  return requestPromise
}

// Simple API object - just the basics
export const api = {
  get: async (endpoint) => ({ data: await request(endpoint) }),
  post: async (endpoint, data) => ({ data: await request(endpoint, { method: 'POST', body: JSON.stringify(data) }) }),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id, data = {}) => request(`/projects/${id}`, { method: 'DELETE', body: JSON.stringify(data) }),
  
  // Test endpoint
  test: () => request('/test'),
  
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getUser: () => request('/auth/me'),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  // Password reset
  sendResetToken: (email) => request('/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyResetToken: (email, token) => request('/password/verify', { method: 'POST', body: JSON.stringify({ email, token }) }),
  resetPassword: (data) => request('/password/reset', { method: 'POST', body: JSON.stringify(data) }),
  
  // Users
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/users${queryString ? '?' + queryString : ''}`)
  },
  getSalesUsers: () => request('/users/sales'),
  getEngineers: () => request('/users/engineers'),
  getUserById: (id) => request(`/users/${id}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  approveUser: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  rejectUser: (id, reason) => request(`/users/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason: normalizeReasonPayload(reason) }) }),
  assignProject: (id, projectId) => request(`/users/${id}/assign-projects`, { method: 'POST', body: JSON.stringify({ project_id: projectId }) }),
  
  // Customers
  getCustomers: (params = {}) => {
    const cleanParams = {}
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        cleanParams[key] = params[key]
      }
    })
    const queryString = new URLSearchParams(cleanParams).toString()
    return request(`/customers${queryString ? '?' + queryString : ''}`)
  },
  getPendingCustomers: () => request('/customers/pending'),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomer: (id) => request(`/customers/${id}`),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  approveCustomer: (id) => request(`/customers/${id}/approve`, { method: 'POST' }),
  rejectCustomer: (id, reason) => request(`/customers/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: normalizeReasonPayload(reason) }) }),

  
  // Plan Visits
  getPlanVisits: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/plan-visits${queryString ? '?' + queryString : ''}`)
  },
  getApprovedPlanVisits: () => request('/plan-visits/approved'),
  getPendingPlanVisits: () => request('/plan-visits/pending'),
  createPlanVisit: (data) => request('/plan-visits', { method: 'POST', body: JSON.stringify(data), dedupeKey: JSON.stringify(data) }),
  updatePlanVisit: (id, data) => request(`/plan-visits/${id}`, { method: 'PUT', body: JSON.stringify(data), dedupeKey: JSON.stringify(data) }),
  deletePlanVisit: (id) => request(`/plan-visits/${id}`, { method: 'DELETE' }),
  approvePlanVisit: (id) => request(`/plan-visits/${id}/approve`, { method: 'POST' }),
  rejectPlanVisit: (id, reason) => request(`/plan-visits/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: normalizeReasonPayload(reason) }) }),
  completePlanVisit: (id, data) => request(`/plan-visits/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  
  // Realisasi Visits
  getRealisasiVisits: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/realisasi-visits${queryString ? '?' + queryString : ''}`)
  },
  getPendingVisits: () => request('/realisasi-visits/pending'),
  createRealisasiVisit: (data) => request('/realisasi-visits', { method: 'POST', body: JSON.stringify(data) }),
  createUnplannedVisit: (data) => request('/realisasi-visits/unplanned', { method: 'POST', body: JSON.stringify(data) }),
  updateRealisasiVisit: (id, data) => request(`/realisasi-visits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRealisasiVisit: (id) => request(`/realisasi-visits/${id}`, { method: 'DELETE' }),
  getPendingUnplannedVisits: () => request('/realisasi-visits/pending-unplanned'),
  getMyUnplannedVisits: () => request('/realisasi-visits/my-unplanned'),
  approveUnplannedVisit: (id) => request(`/realisasi-visits/${id}/approve-unplanned`, { method: 'POST' }),
  rejectUnplannedVisit: (id, reason) => request(`/realisasi-visits/${id}/reject-unplanned`, { method: 'POST', body: JSON.stringify({ rejection_reason: normalizeReasonPayload(reason) }) }),
  markVisitAsMissed: (planVisitId) => request(`/realisasi-visits/${planVisitId}/mark-missed`, { method: 'POST' }),
  
  // Attendance
  getAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/attendance${queryString ? '?' + queryString : ''}`)
  },
  getTodayAttendance: () => request('/attendance/today'),
  getAttendanceSummary: () => request('/attendance/summary'),
  getAdminAttendanceMonitor: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/attendance${queryString ? '?' + queryString : ''}`)
  },
  checkIn: (data) => request('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: (data) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  
  // Warnings
  getWarnings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/warnings${queryString ? '?' + queryString : ''}`)
  },
  getWarningStats: () => request('/warnings/stats'),
  createWarning: (data) => request('/warnings', { method: 'POST', body: JSON.stringify(data) }),
  updateWarning: (id, data) => request(`/warnings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarning: (id) => request(`/warnings/${id}`, { method: 'DELETE' }),
  
  // Visit Reports
  getVisitReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/visit-reports${queryString ? '?' + queryString : ''}`)
  },
  getSalesPerformance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/visit-reports/sales-performance${queryString ? '?' + queryString : ''}`)
  },
  getDashboardStats: () => request('/visit-reports/dashboard-stats'),
  getCustomerVisitHistory: (customerId) => request(`/visit-reports/customer/${customerId}/history`),
  
  // Locations
  getLocations: () => request('/locations'),
  createLocation: (data) => request('/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id, data) => request(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLocation: (id) => request(`/locations/${id}`, { method: 'DELETE' }),
  
  // Activity Logs
  getActivityLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/activity-logs${queryString ? '?' + queryString : ''}`)
  },
  
  // Notifications (legacy aliases — kept for backward compat)
  getUnreadNotificationCount: () => request('/notifications/unread-count'),
  markNotificationAsRead: (id) => request(`/notifications/${id}/mark-read`, { method: 'POST' }),
  markAllNotificationsAsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  
  // Documents
  getDocuments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/documents${queryString ? '?' + queryString : ''}`)
  },
  uploadDocument: (formData) => {
    // FormData upload — must NOT set Content-Type (browser sets multipart boundary automatically)
    const token = getToken()
    const url = `${API_BASE}/documents`
    const headers = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(url, { method: 'POST', headers, body: formData })
      .then(async res => {
        if (res.status === 401) { localStorage.removeItem('amsar-auth'); window.location.href = '/login'; throw new Error('Session expired') }
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw { message: d.message || `HTTP ${res.status}`, errors: d.errors || {}, status: res.status } }
        return res.json()
      })
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  
  // Materials
  getMaterials: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/materials${queryString ? '?' + queryString : ''}`)
  },
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
  
  // Manpower
  getManpower: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/manpower${queryString ? '?' + queryString : ''}`)
  },
  createManpower: (data) => request('/manpower', { method: 'POST', body: JSON.stringify(data) }),
  updateManpower: (id, data) => request(`/manpower/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteManpower: (id) => request(`/manpower/${id}`, { method: 'DELETE' }),
  
  // Progress Reports
  getProgressReports: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/progress-reports${queryString ? '?' + queryString : ''}`)
  },
  createProgressReport: (data) => request('/progress-reports', { method: 'POST', body: JSON.stringify(data) }),
  
  // Engineer
  getEngineerProjects: () => request('/engineer/projects'),
  getEngineerProgressReports: () => request('/engineer/progress-reports'),
  createEngineerProgressReport: (data) => request('/engineer/progress-reports', { method: 'POST', body: JSON.stringify(data) }),
  submitProgressReport: (data) => request('/engineer/progress-reports', { method: 'POST', body: JSON.stringify(data) }),
  
  // Dashboards
  getAdminDashboard: () => request('/dashboard/admin'),
  getSalesManagerDashboard: () => request('/dashboard/sales-manager'),
  getSiteManagerDashboard: () => request('/dashboard/site-manager'),
  getEngineerDashboard: () => request('/dashboard/engineer'),
  getSalesDashboard: () => request('/dashboard/sales'),
  
  // Sales Funnel Management
  getFunnels: (params = {}) => {
    const cleanParams = {}
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        cleanParams[key] = params[key]
      }
    })
    const queryString = new URLSearchParams(cleanParams).toString()
    return request(`/funnels${queryString ? '?' + queryString : ''}`)
  },
  getFunnelStats: () => request('/funnels/stats/summary'),
  getFunnel: (id) => request(`/funnels/${id}`),
  createFunnel: (data) => request('/funnels', { method: 'POST', body: JSON.stringify(data) }),
  updateFunnel: (id, data) => request(`/funnels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFunnel: (id) => request(`/funnels/${id}`, { method: 'DELETE' }),
  markFunnelAsWon: (id, data) => request(`/funnels/${id}/mark-won`, { method: 'POST', body: JSON.stringify(data) }),
  markFunnelAsLost: (id, data) => request(`/funnels/${id}/mark-lost`, { method: 'POST', body: JSON.stringify(data) }),
  getFunnelActivities: (id) => request(`/funnels/${id}/activities`),
  createFunnelActivity: (id, data) => request(`/funnels/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
  getVisitedCustomers: () => request('/funnels/visited-customers'),
  
  // Search
  search: (query) => {
    const queryString = new URLSearchParams({ q: query }).toString()
    return request(`/search?${queryString}`)
  },
  
  // Project specific
  getProjectKpiSummary: () => request('/projects/kpi-summary'),
  assignEngineer: (projectId, engineerId) => request(`/projects/${projectId}/assign-engineer`, { method: 'POST', body: JSON.stringify({ engineer_id: engineerId }) }),
  assignEngineersToProject: (projectOrPayload, engineerIds = []) => {
    const payload = typeof projectOrPayload === 'object' && projectOrPayload !== null
      ? projectOrPayload
      : { project_id: projectOrPayload, engineer_ids: engineerIds }

    return request('/projects/assign-engineers', { method: 'POST', body: JSON.stringify(payload) })
  },
  getEngineers: () => request('/projects/engineers/list'),
  completeProject: (id, note) => request(`/projects/${id}/complete`, { method: 'POST', body: JSON.stringify({ note }) }),
  restoreProject: (id) => request(`/projects/${id}/restore`, { method: 'POST' }),

  // Notifications (backend-driven)
  getNotifications: () => request('/notifications'),
  getNotificationsUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/mark-read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAllNotifications: () => request('/notifications', { method: 'DELETE' }),

  // Check server status (for ServerStatus component)
  checkServerStatus: async () => {
    try {
      const response = await request('/test')
      return response.success === true
    } catch (error) {
      return false
    }
  },
}

// Export request function for direct use
export { request }
