import { Bell, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function Topbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Cari proyek, dokumen..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0f4c81] flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
