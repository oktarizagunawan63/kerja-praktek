import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, UserCheck, UserX, Trash2 } from 'lucide-react'

// Enhanced toast with custom styling and icons
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      className: 'toast-success',
      icon: '✅',
      ...options
    })
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      className: 'toast-error',
      icon: '❌',
      ...options
    })
  },

  info: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      className: 'toast-info',
      icon: 'ℹ️',
      ...options
    })
  },

  // Specialized toasts for user actions
  userApproved: (userName, role) => {
    return toast.success(
      `${userName} berhasil disetujui sebagai ${role}`,
      {
        duration: 5000,
        className: 'toast-success',
        icon: '🎉',
      }
    )
  },

  userRejected: (userName) => {
    return toast.error(
      `${userName} telah ditolak`,
      {
        duration: 4000,
        className: 'toast-error',
        icon: '❌',
      }
    )
  },

  userDeleted: (userName) => {
    return toast.success(
      `${userName} berhasil dihapus`,
      {
        duration: 4000,
        className: 'toast-info',
        icon: '🗑️',
      }
    )
  }
}