import { showErrorToast, logSilentError } from '../utils/errorHandler'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const getToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('amsar-auth') || '{}')
    // Token bisa ada di auth.state.token (zustand persist) atau auth.token
    return auth?.state?.token || auth?.token
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

// Helper function for graceful fallback when API fails
async function fallbackRequest(method, path, body = null) {
  console.log(`[FALLBACK] ${method} ${path} - returning empty data due to API failure`)
  return Promise.resolve({ success: true, data: [] })
}

async function request(method, path, body = null, isFormData = false, silent = false) {
  const token = getToken()
  const headers = { Accept: 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData && body) headers['Content-Type'] = 'application/json'

  const shouldBeSilent = silent

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : null),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Server error' }))
      
      const errorMessage = errorData.message || `HTTP ${res.status}`
      
      if (shouldBeSilent) {
        logSilentError(path, method, errorMessage)
      } else {
        showErrorToast(errorMessage, path, method)
      }
      
      throw new ApiError(
        errorMessage,
        res.status,
        errorData
      )
    }

    return res.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    
    const errorMessage = error.message || 'Network error occurred'
    
    if (shouldBeSilent) {
      logSilentError(path, method, errorMessage)
    } else {
      showErrorToast(errorMessage, path, method)
    }
    
    throw new ApiError(
      errorMessage,
      0,
      null
    )
  }
}

// Helper function for silent requests
async function silentRequest(method, path, body = null, isFormData = false) {
  return request(method, path, body, isFormData, true)
}

export const api = {
  // Auth
  login:    (data)  => request('POST', '/auth/login', data),
  logout:   ()      => request('POST', '/auth/logout'),
  me:       ()      => request('GET',  '/auth/me'),

  // Password Reset
  sendResetToken:   (email) => request('POST', '/password/send-token', { email }),
  verifyResetToken: (email, token) => request('POST', '/password/verify-token', { email, token }),
  resetPassword:    (data) => request('POST', '/password/reset', data),

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
  getUsers:       (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/users${q ? '?'+q : ''}`)
  },
  createUser:     (data)    => request('POST',   '/users', data),
  updateUser:     (id, d)   => request('PUT',    `/users/${id}`, d),
  deleteUser:     (id)      => request('DELETE', `/users/${id}`),
  assignProject:  (uid, pid) => request('POST',  `/users/${uid}/assign-project`, { project_id: pid }),
  approveUser:    (id)      => request('POST',   `/users/${id}/approve`),
  rejectUser:     (id, reason) => request('POST', `/users/${id}/reject`, { reason }),

  // Locations
  getLocations:   (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/locations${q ? '?'+q : ''}`)
  },
  getProvinces:   ()        => request('GET',    '/locations/provinces'),

  // Visit Management - Customers
  getCustomers:     (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/customers${q ? '?'+q : ''}`)
  },
  getCustomer:      (id)     => request('GET',    `/customers/${id}`),
  createCustomer:   (data)   => request('POST',   '/customers', data),
  updateCustomer:   (id, d)  => request('PUT',    `/customers/${id}`, d),
  deleteCustomer:   (id)     => request('DELETE', `/customers/${id}`),
  getCustomerVisitHistory: (id) => request('GET', `/customers/${id}/visit-history`),

  // Visit Management - Plan Visits
  getPlanVisits:    (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/plan-visits${q ? '?'+q : ''}`)
  },
  getPlanVisit:     (id)     => request('GET',    `/plan-visits/${id}`),
  createPlanVisit:  (data)   => request('POST',   '/plan-visits', data),
  updatePlanVisit:  (id, d)  => request('PUT',    `/plan-visits/${id}`, d),
  deletePlanVisit:  (id)     => request('DELETE', `/plan-visits/${id}`),
  getSalesUsers:    ()       => request('GET',    '/plan-visits/sales-users'),

  // Visit Management - Realisasi Visits
  getRealisasiVisits: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/realisasi-visits${q ? '?'+q : ''}`)
  },
  getRealisasiVisit: (id)    => request('GET',    `/realisasi-visits/${id}`),
  createRealisasiVisit: (data) => request('POST', '/realisasi-visits', data),
  updateRealisasiVisit: (id, d) => request('PUT', `/realisasi-visits/${id}`, d),
  markVisitAsMissed: (planVisitId) => request('POST', `/realisasi-visits/mark-missed/${planVisitId}`),
  getPendingVisits:  ()      => request('GET',    '/realisasi-visits/pending-visits'),

  // Visit Management - Attendance
  getAttendance:     (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/attendance${q ? '?'+q : ''}`)
  },
  checkIn:          (data)   => request('POST',   '/attendance/check-in', data),
  checkOut:         (data)   => request('POST',   '/attendance/check-out', data),
  getTodayAttendance: ()     => request('GET',    '/attendance/today'),
  getAttendanceSummary: ()   => request('GET',    '/attendance/summary'),
  resetAttendance:  (data)   => request('POST',   '/attendance/reset', data),

  // Visit Management - Warnings
  getWarnings:      (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/warnings${q ? '?'+q : ''}`)
  },
  getWarning:       (id)     => request('GET',    `/warnings/${id}`),
  markWarningRead:  (id)     => request('POST',   `/warnings/${id}/read`),
  markAllWarningsRead: ()    => request('POST',   '/warnings/mark-all-read'),
  getUnreadWarningsCount: () => request('GET',    '/warnings/unread-count'),
  deleteWarning:    (id)     => request('DELETE', `/warnings/${id}`),
  getWarningStats:  ()       => request('GET',    '/warnings/stats'),

  // Visit Management - Reports
  getDashboardStats: ()      => request('GET',    '/reports/dashboard-stats'),
  getMySalesStats:   ()      => request('GET',    '/reports/my-sales-stats'),
  getVisitReport:   (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/reports/visit-report${q ? '?'+q : ''}`)
  },
  getSalesPerformance: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/reports/sales-performance${q ? '?'+q : ''}`)
  },
}
