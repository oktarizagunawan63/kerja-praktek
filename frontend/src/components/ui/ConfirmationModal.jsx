import { useState } from 'react'
import { AlertTriangle, UserCheck, UserX, Trash2, X } from 'lucide-react'
import Button from './Button'
import Input from './Input'

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  type = 'approval', // 'approval', 'rejection', 'deletion'
  user = null,
  title,
  message,
  requireReason = false,
  loading = false
}) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setReasonError('Alasan wajib diisi')
      return
    }
    
    setReasonError('')
    onConfirm(reason.trim())
  }

  const handleClose = () => {
    setReason('')
    setReasonError('')
    onClose()
  }

  if (!open) return null

  const getConfig = () => {
    switch (type) {
      case 'approval':
        return {
          icon: UserCheck,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50',
          confirmText: 'Ya, Setujui',
          confirmVariant: 'success',
          title: title || 'Konfirmasi Persetujuan',
          defaultMessage: user ? `Apakah Anda yakin ingin menyetujui ${user.name} sebagai ${user.role}?` : 'Konfirmasi persetujuan user'
        }
      case 'rejection':
        return {
          icon: UserX,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          confirmText: 'Ya, Tolak',
          confirmVariant: 'danger',
          title: title || 'Konfirmasi Penolakan',
          defaultMessage: user ? `Apakah Anda yakin ingin menolak ${user.name}?` : 'Konfirmasi penolakan user'
        }
      case 'deletion':
        return {
          icon: Trash2,
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-100',
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50',
          confirmText: 'Ya, Hapus',
          confirmVariant: 'danger',
          title: title || 'Konfirmasi Penghapusan',
          defaultMessage: user ? `Apakah Anda yakin ingin menghapus ${user.name}? Tindakan ini tidak dapat dibatalkan.` : 'Konfirmasi penghapusan user'
        }
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50',
          confirmText: 'Ya, Lanjutkan',
          confirmVariant: 'primary',
          title: title || 'Konfirmasi',
          defaultMessage: message || 'Apakah Anda yakin?'
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className={`relative bg-white border ${config.borderColor} rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon size={32} className={config.iconColor} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {config.title}
            </h3>
            
            <p className="text-gray-600">
              {message || config.defaultMessage}
            </p>
          </div>

          {/* User Details */}
          {user && (
            <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}>
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
                {user.created_at && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500">Tanggal Daftar:</span>
                    <p className="font-semibold text-gray-900">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason Input (for rejection) */}
          {requireReason && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan {type === 'rejection' ? 'Penolakan' : 'Tindakan'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (reasonError) setReasonError('')
                }}
                placeholder={`Jelaskan alasan ${type === 'rejection' ? 'penolakan' : 'tindakan'}...`}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm resize-none ${
                  reasonError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                rows={3}
                disabled={loading}
              />
              {reasonError && (
                <p className="text-red-500 text-xs mt-1">{reasonError}</p>
              )}
            </div>
          )}

          {/* Warning for Deletion */}
          {type === 'deletion' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Peringatan!</h4>
                  <p className="text-sm text-red-700">
                    Tindakan ini akan menghapus user secara permanen dari sistem. 
                    Semua data terkait user akan hilang dan tidak dapat dikembalikan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleClose}
              variant="secondary"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              variant={config.confirmVariant}
              loading={loading}
              loadingText="Memproses..."
            >
              {config.confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}