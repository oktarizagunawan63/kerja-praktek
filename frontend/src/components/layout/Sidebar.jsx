import { NavLink } from 'react-router-dom'
import { useMemo } from 'react'
import {
  LayoutDashboard, FolderKanban, FileText,
  BarChart3, Bell, Activity, Users,
  MapPin, Calendar, CheckSquare, Clock, AlertTriangle, Settings, TrendingUp, ClipboardCheck
} from '../../lib/icons.jsx'
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
        { to: '/visit-reports', icon: BarChart3, label: 'Visit Reports', tourId: 'visit-reports' },
        { to: '/reports', icon: ClipboardCheck, label: 'Laporan Proyek', tourId: 'reports' },
        { to: '/warnings', icon: AlertTriangle, label: 'Warnings', tourId: 'warnings' }
      ]
    },
    { 
      title: 'Sales Funnel', 
      items: [
        { to: '/funnels', icon: TrendingUp, label: 'Sales Funnel', tourId: 'funnels' }
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
    },
    { 
      title: 'Sales Funnel', 
      items: [
        { to: '/funnels', icon: TrendingUp, label: 'Sales Funnel', tourId: 'funnels' }
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
    },
    { 
      title: 'Sales Funnel', 
      items: [
        { to: '/funnels', icon: TrendingUp, label: 'Sales Funnel', tourId: 'funnels' }
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

export default function Sidebar({ mobileOpen = false, onClose, onNavigate }) {
  const { user } = useAuthStore()
  const notificationUnreadCount = useAppStore(state => state.notificationUnreadCount)
  
  // Memoize expensive calculations
  const { sections, unreadCount } = useMemo(() => {
    const role = normalizeRole(user?.role)
    
    return {
      sections: NAV_SECTIONS[role] || NAV_SECTIONS.engineer,
      unreadCount: notificationUnreadCount
    }
  }, [user?.role, notificationUnreadCount])

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[272px] max-w-[86vw] shrink-0 flex-col bg-[#237043] shadow-xl transition-transform duration-200 lg:pointer-events-auto lg:static lg:z-auto lg:h-full lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'pointer-events-auto translate-x-0' : 'pointer-events-none -translate-x-full'}`} data-tour="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <AmsarLogo size={38} />
        <div>
          <p className="text-sm font-bold leading-tight text-white">PT Amsar</p>
          <p className="text-xs text-slate-300">Prima Mandiri</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Section Header */}
            {section.title && sections.length > 1 && (
              <div className="px-3 py-2 mt-4 first:mt-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              </div>
            )}
            
            {/* Section Items */}
            {section.items.map(({ to, icon: Icon, label, badge, tourId }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                data-tour={tourId}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/[0.12] text-white ring-1 ring-white/10'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
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
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.12] text-xs font-bold text-white ring-1 ring-white/15">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-white">{user?.name ?? 'User'}</p>
            <p className="text-xs text-slate-400">{getRoleDisplayName(user?.role) ?? '-'}</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}

