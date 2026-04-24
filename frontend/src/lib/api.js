const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

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

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  const token = getToken()
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const config = {
    ...options,
    headers
  }

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
  }
}

// Simple API object - just the basics
export const api = {
  // Projects
  getProjects: () => request('/projects'),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  
  // Test endpoint
  test: () => request('/test'),
  
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getUser: () => request('/auth/me'),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  // Password reset
  sendResetToken: (email) => request('/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyResetToken: (token) => request('/password/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  resetPassword: (data) => request('/password/reset', { method: 'POST', body: JSON.stringify(data) }),
  
  // Users
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/users${queryString ? '?' + queryString : ''}`)
  },
  getSalesUsers: () => request('/users/sales'),
  getEngineers: () => request('/users/engineers'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  approveUser: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  rejectUser: (id, reason) => request(`/users/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: reason }) }),
  
  // Customers
  getCustomers: () => request('/customers'),
  getPendingCustomers: () => request('/customers/pending'),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomer: (id) => request(`/customers/${id}`),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  approveCustomer: (id) => request(`/customers/${id}/approve`, { method: 'POST' }),
  rejectCustomer: (id, reason) => request(`/customers/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: reason }) }),

  
  // Plan Visits
  getPlanVisits: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/plan-visits${queryString ? '?' + queryString : ''}`)
  },
  getApprovedPlanVisits: () => request('/plan-visits/approved'),
  getPendingPlanVisits: () => request('/plan-visits/pending'),
  getPendingVisits: () => request('/plan-visits/pending'),
  createPlanVisit: (data) => request('/plan-visits', { method: 'POST', body: JSON.stringify(data) }),
  updatePlanVisit: (id, data) => request(`/plan-visits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanVisit: (id) => request(`/plan-visits/${id}`, { method: 'DELETE' }),
  approvePlanVisit: (id) => request(`/plan-visits/${id}/approve`, { method: 'POST' }),
  rejectPlanVisit: (id, reason) => request(`/plan-visits/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: reason }) }),
  completePlanVisit: (id, data) => request(`/plan-visits/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  
  // Realisasi Visits
  getRealisasiVisits: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/realisasi-visits${queryString ? '?' + queryString : ''}`)
  },
  createRealisasiVisit: (data) => request('/realisasi-visits', { method: 'POST', body: JSON.stringify(data) }),
  createUnplannedVisit: (data) => request('/realisasi-visits/unplanned', { method: 'POST', body: JSON.stringify(data) }),
  updateRealisasiVisit: (id, data) => request(`/realisasi-visits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRealisasiVisit: (id) => request(`/realisasi-visits/${id}`, { method: 'DELETE' }),
  getPendingUnplannedVisits: () => request('/realisasi-visits/pending-unplanned'),
  approveUnplannedVisit: (id) => request(`/realisasi-visits/${id}/approve-unplanned`, { method: 'POST' }),
  rejectUnplannedVisit: (id, data) => request(`/realisasi-visits/${id}/reject-unplanned`, { method: 'POST', body: JSON.stringify(data) }),
  markVisitAsMissed: (planVisitId) => request(`/realisasi-visits/${planVisitId}/mark-missed`, { method: 'POST' }),
  
  // Attendance
  getAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/attendance${queryString ? '?' + queryString : ''}`)
  },
  getTodayAttendance: () => request('/attendance/today'),
  getAttendanceSummary: () => request('/attendance/summary'),
  checkIn: (data) => request('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: (data) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  
  // Warnings
  getWarnings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/warnings${queryString ? '?' + queryString : ''}`)
  },
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
  
  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadNotificationCount: () => request('/notifications/unread-count'),
  markNotificationAsRead: (id) => request(`/notifications/${id}/mark-read`, { method: 'POST' }),
  markAllNotificationsAsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  
  // Documents
  getDocuments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/documents${queryString ? '?' + queryString : ''}`)
  },
  uploadDocument: (data) => request('/documents', { method: 'POST', body: JSON.stringify(data) }),
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
  
  // Dashboards
  getAdminDashboard: () => request('/dashboard/admin'),
  getSalesManagerDashboard: () => request('/dashboard/sales-manager'),
  getSiteManagerDashboard: () => request('/dashboard/site-manager'),
  getEngineerDashboard: () => request('/dashboard/engineer'),
  
  // Search
  search: (query) => {
    const queryString = new URLSearchParams({ q: query }).toString()
    return request(`/search?${queryString}`)
  },
  
  // Project specific
  getProjectKpiSummary: () => request('/projects/kpi-summary'),
  assignEngineer: (projectId, engineerId) => request(`/projects/${projectId}/assign-engineer`, { method: 'POST', body: JSON.stringify({ engineer_id: engineerId }) }),
  assignEngineersToProject: (projectId, engineerIds) => request('/projects/assign-engineers', { method: 'POST', body: JSON.stringify({ project_id: projectId, engineer_ids: engineerIds }) }),
  getEngineers: () => request('/projects/engineers/list'),
  completeProject: (id, note) => request(`/projects/${id}/complete`, { method: 'POST', body: JSON.stringify({ note }) }),
  restoreProject: (id) => request(`/projects/${id}/restore`, { method: 'POST' }),

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
