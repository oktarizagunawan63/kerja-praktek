import { useState } from 'react'
import { X, CheckCircle, Users, FolderOpen, Bell } from 'lucide-react'
import Button from './Button'

export default function WelcomeCard({ user, onDismiss }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  const getRoleWelcomeMessage = (role) => {
    switch (role) {
      case 'administrator':
      case 'director':
      case 'direktur':
        return {
          title: 'Selamat Datang, Administrator!',
          message: 'Anda memiliki akses penuh untuk mengelola semua proyek, user, dan sistem perusahaan.',
          features: [
            'Kelola semua proyek perusahaan',
            'Approve registrasi user baru',
            'Monitor progress dan laporan',
            'Akses ke semua fitur sistem'
          ]
        }
      case 'sales_manager':
      case 'site_manager':
        return {
          title: 'Selamat Datang, Sales Manager!',
          message: 'Anda dapat mengelola customer dan visit management dengan efisien.',
          features: [
            'Kelola proyek yang ditugaskan',
            'Approve registrasi engineer',
            'Monitor progress proyek',
            'Koordinasi dengan tim lapangan'
          ]
        }
      case 'engineer':
        return {
          title: 'Selamat Datang, Engineer!',
          message: 'Anda dapat mengakses proyek yang ditugaskan dan melaporkan progress pekerjaan.',
          features: [
            'Akses proyek yang ditugaskan',
            'Update progress pekerjaan',
            'Upload dokumen proyek',
            'Komunikasi dengan tim'
          ]
        }
      default:
        return {
          title: 'Selamat Datang!',
          message: 'Akun Anda telah aktif dan siap digunakan.',
          features: [
            'Akses dashboard sistem',
            'Kelola profil Anda',
            'Berkolaborasi dengan tim',
            'Akses fitur sesuai role'
          ]
        }
    }
  }

  const welcome = getRoleWelcomeMessage(user?.role)

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {welcome.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Halo <strong>{user?.name}</strong>! {welcome.message}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {welcome.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>Role: {user?.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen size={16} />
              <span>Status: Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell size={16} />
              <span>Notifikasi: Aktif</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-gray-500">
              💡 <strong>Tips:</strong> Jelajahi menu di sidebar untuk memulai. 
              Jika ada pertanyaan, hubungi administrator sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}