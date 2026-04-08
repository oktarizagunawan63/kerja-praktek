// Utility to clear error notifications
export const clearErrorNotifications = () => {
  // Clear any existing toast notifications
  if (typeof window !== 'undefined') {
    // Clear react-hot-toast notifications
    import('react-hot-toast').then(({ default: toast }) => {
      toast.dismiss()
    })
    
    // Clear any error states in localStorage if needed
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes('error') || key.includes('notification')) {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.warn('Could not clear localStorage key:', key)
        }
      }
    })
  }
}

// Auto-clear on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', clearErrorNotifications)
}