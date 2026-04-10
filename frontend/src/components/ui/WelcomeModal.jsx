import { useState } from 'react'
import { X, CheckCircle, ArrowRight, Users, FolderOpen, Bell, Settings } from 'lucide-react'
import Button from './Button'

export default function WelcomeModal({ 
  open, 
  onClose, 
  user
}) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!open || !user) return null

  const getRoleWelcomeData = (role) => {
    switch (role) {
      case 'administrator':
      case 'director':
      case 'direktur':
        return {
          title: 'Selamat Datang, Administrator!',
          subtitle: 'Anda memiliki akses penuh untuk mengelola PT Amsar Prima Mandiri',
          features: [
            { icon: Users, title: 'Kelola Tim', desc: 'Approve user baru dan assign proyek' },
            { icon: FolderOpen, title: 'Monitor Proyek', desc: 'Pantau semua proyek perusahaan' },
            { icon: Bell, title: 'Notifikasi Real-time', desc: 'Dapatkan update progress terkini' },
            { icon: Settings, title: 'Pengaturan Sistem', desc: 'Konfigurasi dan manajemen sistem' }
          ]
        }
      case 'site_manager':
        return {
          title: 'Selamat Datang, Site Manager!',
          subtitle: 'Kelola customer dan visit management dengan efisien',
          features: [
            { icon: FolderOpen, title: 'Kelola Proyek', desc: 'Monitor dan update progress proyek' },
            { icon: Users, title: 'Tim Engineer', desc: 'Approve dan koordinasi dengan engineer' },
            { icon: Bell, title: 'Update Progress', desc: 'Laporkan kemajuan ke administrator' }
          ]
        }
      case 'engineer':
        return {
          title: 'Selamat Datang, Engineer!',
          subtitle: 'Mulai berkontribusi dalam proyek-proyek PT Amsar',
          features: [
            { icon: FolderOpen, title: 'Proyek Saya', desc: 'Akses proyek yang ditugaskan' },
            { icon: Bell, title: 'Update Progress', desc: 'Laporkan kemajuan pekerjaan' }
          ]
        }
      default:
        return {
          title: 'Selamat Datang!',
          subtitle: 'Mulai gunakan sistem PT Amsar Prima Mandiri',
          features: []
        }
    }
  }

  const welcomeData = getRoleWelcomeData(user.role)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Selamat Bergabung! 🎉</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{welcomeData.title}</h2>
            <p className="text-gray-600 mb-4">{welcomeData.subtitle}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Halo {user.name}!</strong> Akun Anda telah disetujui dan sekarang aktif. 
                Selamat bergabung dengan tim PT Amsar!
              </p>
            </div>
          </div>

          {/* Features */}
          {welcomeData.features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Fitur yang tersedia untuk Anda:</h3>
              <div className="space-y-3">
                {welcomeData.features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                        <p className="text-xs text-gray-600">{feature.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-100">
          <Button
            onClick={onClose}
            variant="primary"
            rightIcon={<CheckCircle size={16} />}
          >
            Mulai Menggunakan
          </Button>
        </div>
      </div>
    </div>
  )
}