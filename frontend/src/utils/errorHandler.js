// Error handler utility to prevent spam notifications
class ErrorHandler {
  constructor() {
    this.recentErrors = new Map()
    this.errorCooldown = 10000 // 10 seconds cooldown
    this.silentEndpoints = new Set([
      '/attendance',
      '/attendance/today',
      '/realisasi-visits/pending-visits',
      '/warnings',
      '/customers',
      '/plan-visits/sales-users',
      '/plan-visits'
    ])
  }

  shouldShowError(errorKey, message, endpoint) {
    // Check if this endpoint should be silent
    if (this.silentEndpoints.has(endpoint)) {
      console.warn(`Silent API error for ${endpoint}:`, message)
      return false
    }
    
    const now = Date.now()
    const lastError = this.recentErrors.get(errorKey)
    
    if (lastError && (now - lastError.timestamp) < this.errorCooldown) {
      // Same error within cooldown period, don't show
      return false
    }
    
    // Store this error
    this.recentErrors.set(errorKey, {
      message,
      timestamp: now
    })
    
    return true
  }

  clearError(errorKey) {
    this.recentErrors.delete(errorKey)
  }

  clearAllErrors() {
    this.recentErrors.clear()
  }

  // Add endpoint to silent list
  addSilentEndpoint(endpoint) {
    this.silentEndpoints.add(endpoint)
  }

  // Remove endpoint from silent list
  removeSilentEndpoint(endpoint) {
    this.silentEndpoints.delete(endpoint)
  }
}

export const errorHandler = new ErrorHandler()

// Helper function to create error keys
export const createErrorKey = (endpoint, method = 'GET') => {
  return `${method}:${endpoint}`
}

  // Enhanced toast error function with complete silence for specific endpoints
export const showErrorToast = (message, endpoint, method = 'GET') => {
  // Completely silent endpoints - never show errors
  const completelySilentEndpoints = [
    '/attendance',
    '/attendance/today', 
    '/realisasi-visits/pending-visits',
    '/warnings',
    '/customers',
    '/reports/dashboard-stats',
    '/reports/my-sales-stats',
    '/plan-visits/sales-users',
    '/plan-visits'
  ]
  
  // Check if this endpoint should be completely silent
  if (completelySilentEndpoints.some(silent => endpoint.includes(silent))) {
    console.warn(`[SILENT] API error for ${endpoint}:`, message)
    return false
  }
  
  const errorKey = createErrorKey(endpoint, method)
  
  if (errorHandler.shouldShowError(errorKey, message, endpoint)) {
    // Only import toast when needed to avoid circular dependencies
    import('react-hot-toast').then(({ default: toast }) => {
      toast.error(message)
    })
    return true
  }
  
  return false
}

// Silent error logging for debugging
export const logSilentError = (endpoint, method, error) => {
  console.warn(`Silent API error [${method}] ${endpoint}:`, error)
}