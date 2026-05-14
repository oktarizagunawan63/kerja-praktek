import { createElement } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, UserCheck, UserX, Trash2 } from '@icons'

// Enhanced toast with custom styling and icons
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      className: 'toast-success',
      icon: createElement(CheckCircle, { size: 18, className: 'text-[#5a9844]' }),
      ...options
    })
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      className: 'toast-error',
      icon: createElement(XCircle, { size: 18, className: 'text-[#d54496]' }),
      ...options
    })
  },

  info: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      className: 'toast-info',
      icon: createElement(Info, { size: 18, className: 'text-[#de168c]' }),
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
        icon: createElement(UserCheck, { size: 18, className: 'text-[#5a9844]' }),
      }
    )
  },

  userRejected: (userName) => {
    return toast.error(
      `${userName} telah ditolak`,
      {
        duration: 4000,
        className: 'toast-error',
        icon: createElement(UserX, { size: 18, className: 'text-[#d54496]' }),
      }
    )
  },

  userDeleted: (userName) => {
    return toast.success(
      `${userName} berhasil dihapus`,
      {
        duration: 4000,
        className: 'toast-info',
        icon: createElement(Trash2, { size: 18, className: 'text-[#de168c]' }),
      }
    )
  }
}
