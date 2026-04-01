import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, FileText,
  BarChart3, Bell, Activity, LogOut, Users
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import clsx from 'clsx'
import amsarLogo from '../../assets/amsar.png?url'

const BASE_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',      icon: FolderKanban,    label: 'Proyek' },
  { to: '/documents',     icon: FileText,        label: 'Dokumen' },
  { to: '/reports',       icon: BarChart3,       label: 'Laporan' },
  { to: '/notifications', icon: Bell,            label: 'Notifikasi', badge: true },
]

const DIRECTOR_NAV = [
  ...BASE_NAV,
  { to: '/activity', icon: Activity, label: 'Activity Log' },
  { to: '/users',    icon: Users,    label: 'Manajemen User' },
]

function AmsarLogo({ size = 40 }) {
  return (
    <img
      src={amsarLogo}
      alt="PT Amsar"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { notifications } = useAppStore()
  const unread = notifications.filter(n => !n.isRead).length

  const navItems = user?.role === 'direktur' ? DIRECTOR_NAV : BASE_NAV

  return (
    <aside className="w-64 bg-[#0f4c81] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <AmsarLogo size={38} />
        <div>
          <p className="text-white font-bold text-sm leading-tight">PT Amsar</p>
          <p className="text-blue-200 text-xs">Prima Mandiri</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
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
            <div className="relative shrink-0">
              <Icon size={18} />
              {badge && unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
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
