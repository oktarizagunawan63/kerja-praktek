import { useState, useEffect } from 'react'
import { CheckCircle, X, UserCheck, UserX, Trash2, Bell } from 'lucide-react'
import Button from './Button'

export default function SuccessModal({ 
  open, 
  onClose, 
  type = 'success', // 'success', 'approval', 'rejection', 'deletion'
  title, 
  message, 
  user = null,
  autoClose = true,
  autoCloseDelay = 3000 
}) {
  const [countdown, setCountdown] = useState(autoCloseDelay / 1000)

  useEffect(() => {
    if (!open || !autoClose) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open, autoClose, onClose])

  useEffect(() => {
    if (open) {
      setCountdown(autoCloseDelay / 1000)
    }
  }, [open, autoCloseDelay])

  if (!open) return null

  const getConfig = () => {
    switch (type) {
      case 'approval':
        return {
          icon: UserCheck,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          borderColor: 'border-green-200',
          bgGradient: 'from-green-50 to-emerald-50',
          title: title || 'User Berhasil Disetujui! 🎉',
          defaultMessage: user ? `${user.name} telah disetujui sebagai ${user.role}` : 'User berhasil disetujui'
        }
      case 'rejection':
        return {
          icon: UserX,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          borderColor: 'border-red-200',
          bgGradient: 'from-red-50 to-pink-50',
          title: title || 'User Ditolak',
          defaultMessage: user ? `${user.name} telah ditolak` : 'User berhasil ditolak'
        }
      case 'deletion':
        return {
          icon: Trash2,
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-100',
          borderColor: 'border-orange-200',
          bgGradient: 'from-orange-50 to-yellow-50',
          title: title || 'User Berhasil Dihapus',
          defaultMessage: user ? `${user.name} telah dihapus dari sistem` : 'User berhasil dihapus'
        }
      default:
        return {
          icon: CheckCircle,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          borderColor: 'border-blue-200',
          bgGradient: 'from-blue-50 to-indigo-50',
          title: title || 'Berhasil!',
          defaultMessage: message || 'Operasi berhasil dilakukan'
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-bounce-in`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse`}>
            <Icon size={40} className={config.iconColor} />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {config.title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message || config.defaultMessage}
          </p>

          {/* User Details (if provided) */}
          {user && (
            <div className="bg-white/70 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Nama:</span>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Role:</span>
                  <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-500">Email:</span>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Actions for Approval */}
          {type === 'approval' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Bell size={16} />
                <span className="font-medium">Notifikasi Otomatis</span>
              </div>
              <p className="text-sm text-green-600">
                Welcome notification telah dikirim ke user. User dapat langsung login dan mengakses sistem.
              </p>
            </div>
          )}

          {/* Auto Close Countdown */}
          {autoClose && (
            <div className="text-xs text-gray-500 mb-4">
              Otomatis tutup dalam {countdown} detik
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onClose}
              variant="primary"
              className="px-8"
            >
              OK, Mengerti
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// CSS Animation (tambahkan ke global CSS atau Tailwind config)
const styles = `
@keyframes bounce-in {
  0% {
    transform: scale(0.3) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) rotate(2deg);
  }
  70% {
    transform: scale(0.9) rotate(-1deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
`