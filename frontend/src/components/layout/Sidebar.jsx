import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, FileText, Users,
  BarChart3, Bell, Activity, LogOut, Stethoscope
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',       icon: FolderKanban,    label: 'Proyek' },
  { to: '/documents',      icon: FileText,        label: 'Dokumen' },
  { to: '/manpower',       icon: Users,           label: 'Manpower' },
  { to: '/reports',        icon: BarChart3,       label: 'Laporan' },
  { to: '/notifications',  icon: Bell,            label: 'Notifikasi' },
  { to: '/activity',       icon: Activity,        label: 'Activity Log' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-64 bg-[#0f4c81] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-[#0f4c81]" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">PT Amsar</p>
          <p className="text-blue-200 text-xs">Medical Services</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name ?? 'User'}</p>
            <p className="text-blue-300 text-xs capitalize">{user?.role ?? '-'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-blue-200 hover:text-white text-xs w-full px-2 py-1.5 rounded hover:bg-white/10 transition-colors"
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
