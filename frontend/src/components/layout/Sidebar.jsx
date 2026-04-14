import { NavLink } from 'react-router-dom'
import { useMemo } from 'react'
import {
  LayoutDashboard, FolderKanban, FileText,
  BarChart3, Bell, Activity, LogOut, Users,
  MapPin, Calendar, CheckSquare, Clock, AlertTriangle, Settings
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { getRoleDisplayName, normalizeRole } from '../../utils/roleUtils'
import { can, isAdministrator, canAccessVisitManagement, canManageProjects } from '../../lib/permissions'
import clsx from 'clsx'
import amsarLogo from '../../assets/amsar.png?url'

// Pre-defined navigation sections for better performance
const NAV_SECTIONS = {
  administrator: [
    { 
      title: 'Dashboard', 
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' },
        { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true, tourId: 'notifications' }
      ]
    },
    { 
      title: 'Project Management', 
      items: [
        { to: '/projects', icon: FolderKanban, label: 'Proyek', tourId: 'projects' },
        { to: '/documents', icon: FileText, label: 'Dokumen', tourId: 'documents' },
        { to: '/reports', icon: BarChart3, label: 'Laporan', tourId: 'reports' }
      ]
    },
    { 
      title: 'Visit Management', 
      items: [
        { to: '/customers', icon: Users, label: 'Customer List', tourId: 'customers' },
        { to: '/plan-visits', icon: Calendar, label: 'Plan Visit', tourId: 'plan-visits' },
        { to: '/realisasi-visits', icon: CheckSquare, label: 'Realisasi Visit', tourId: 'realisasi-visits' },
        { to: '/attendance', icon: Clock, label: 'Attendance', tourId: 'attendance' },
        { to: '/visit-reports', icon: BarChart3, label: 'Visit Reports', tourId: 'visit-reports' },
        { to: '/warnings', icon: AlertTriangle, label: 'Warnings', tourId: 'warnings' }
      ]
    },
    { 
      title: 'Administration', 
      items: [
        { to: '/activity', icon: Activity, label: 'Activity Log', tourId: 'activity' },
        { to: '/users', icon: Users, label: 'Manajemen User', tourId: 'users' },
        { to: '/admin/attendance-monitor', icon: Clock, label: 'Attendance Monitor', tourId: 'admin-attendance-monitor' }
      ]
    }
  ],
  site_manager: [
    { 
      title: 'Dashboard', 
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' },
        { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true, tourId: 'notifications' }
      ]
    },
    { 
      title: 'Project Management', 
      items: [
        { to: '/projects', icon: FolderKanban, label: 'Proyek', tourId: 'projects' },
        { to: '/documents', icon: FileText, label: 'Dokumen', tourId: 'documents' },
        { to: '/reports', icon: BarChart3, label: 'Laporan', tourId: 'reports' }
      ]
    }
  ],
  sales_manager: [
    { 
      title: 'Dashboard', 
      items: [
        { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' },
        { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true, tourId: 'notifications' }
      ]
    },
    { 
      title: 'Visit Management', 
      items: [
        { to: '/customers', icon: Users, label: 'Customer List', tourId: 'customers' },
        { to: '/plan-visits', icon: Calendar, label: 'Plan Visit', tourId: 'plan-visits' },
        { to: '/realisasi-visits', icon: CheckSquare, label: 'Realisasi Visit', tourId: 'realisasi-visits' },
        { to: '/attendance', icon: Clock, label: 'Attendance', tourId: 'attendance' },
        { to: '/visit-reports', icon: BarChart3, label: 'Visit Reports', tourId: 'visit-reports' },
        { to: '/warnings', icon: AlertTriangle, label: 'Warnings', tourId: 'warnings' }
      ]
    }
  ],
  sales: [
    { 
      title: 'Dashboard', 
      items: [
        { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' },
        { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true, tourId: 'notifications' }
      ]
    },
    { 
      title: 'Visit Management', 
      items: [
        { to: '/customers', icon: Users, label: 'Customer List', tourId: 'customers' },
        { to: '/plan-visits', icon: Calendar, label: 'Plan Visit', tourId: 'plan-visits' },
        { to: '/realisasi-visits', icon: CheckSquare, label: 'Realisasi Visit', tourId: 'realisasi-visits' },
        { to: '/attendance', icon: Clock, label: 'Attendance', tourId: 'attendance' },
        { to: '/visit-reports', icon: BarChart3, label: 'Visit Reports', tourId: 'visit-reports' }
      ]
    }
  ],
  engineer: [
    { 
      title: 'Dashboard', 
      items: [
        { to: '/engineer/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' },
        { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true, tourId: 'notifications' }
      ]
    },
    { 
      title: 'Projects', 
      items: [
        { to: '/engineer/projects', icon: FolderKanban, label: 'Proyek Saya', tourId: 'projects' },
        { to: '/engineer/progress-reports', icon: FileText, label: 'Laporan Progress', tourId: 'progress-reports' }
      ]
    }
  ]
}

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
  
  // Memoize expensive calculations
  const { sections, unreadCount } = useMemo(() => {
    const role = normalizeRole(user?.role)
    const unread = notifications.filter(n => !n.isRead).length
    
    return {
      sections: NAV_SECTIONS[role] || NAV_SECTIONS.engineer,
      unreadCount: unread
    }
  }, [user?.role, notifications])

  return (
    <aside className="w-64 bg-[#0f4c81] flex flex-col h-full shrink-0" data-tour="sidebar">
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
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Section Header */}
            {section.title && sections.length > 1 && (
              <div className="px-3 py-2 mt-4 first:mt-0">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
                  {section.title}
                </p>
              </div>
            )}
            
            {/* Section Items */}
            {section.items.map(({ to, icon: Icon, label, badge, tourId }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={tourId}
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
                  {badge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {label}
              </NavLink>
            ))}
          </div>
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
            <p className="text-blue-300 text-xs">{getRoleDisplayName(user?.role) ?? '-'}</p>
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
