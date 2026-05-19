import { useState } from 'react'
import { X, CheckCircle, Users, FolderOpen, Bell } from '@icons'
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
        return {
          title: 'Selamat Datang, Sales Manager!',
          message: 'Anda dapat mengelola customer dan visit management dengan efisien.',
          features: [
            'Kelola customer dan funnel sales',
            'Approve rencana kunjungan',
            'Monitor performa tim sales',
            'Akses laporan kunjungan'
          ]
        }
      case 'site_manager':
        return {
          title: 'Selamat Datang, Site Manager!',
          message: 'Anda dapat mengelola proyek, bahan, plan pekerjaan, dan progress lapangan.',
          features: [
            'Kelola proyek yang ditugaskan',
            'Tambah dan edit material proyek',
            'Update plan pekerjaan dan progress',
            'Koordinasi dengan engineer lapangan'
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
    <div className="relative mb-4 min-w-0 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:mb-6 sm:p-6">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 sm:right-4 sm:top-4"
      >
        <X size={18} />
      </button>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 sm:h-12 sm:w-12">
            <CheckCircle className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-5 sm:pr-0">
          <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
            {welcome.title}
          </h3>
          
          <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            Halo <strong>{user?.name}</strong>! {welcome.message}
          </p>

          <div className="mb-4 grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
            {welcome.features.map((feature, index) => (
              <div key={index} className="flex min-w-0 items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                <span className="min-w-0 leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
            <div className="flex min-w-0 items-center gap-2">
              <Users size={16} className="shrink-0" />
              <span className="min-w-0 break-words">Role: {user?.role}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <FolderOpen size={16} className="shrink-0" />
              <span>Status: Aktif</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Bell size={16} className="shrink-0" />
              <span>Notifikasi: Aktif</span>
            </div>
          </div>

          <div className="mt-4 border-t border-blue-200 pt-4">
            <p className="text-xs leading-relaxed text-gray-500">
            <strong>Tips:</strong> Jelajahi menu di sidebar untuk memulai. 
              Jika ada pertanyaan, hubungi administrator sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
