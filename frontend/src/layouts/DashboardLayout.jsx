import { Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import useAppStore from '../store/appStore'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const checkNotifications = useAppStore(state => state.checkNotifications)
  const unreadCount = useAppStore(state => state.notificationUnreadCount)
  const previousUnreadCountRef = useRef(0)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  useEffect(() => {
    checkNotifications()
    const interval = window.setInterval(checkNotifications, 30000)
    return () => window.clearInterval(interval)
  }, [checkNotifications])

  useEffect(() => {
    const previousUnreadCount = previousUnreadCountRef.current
    if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
      toast('Ada notifikasi baru', {
        icon: '!',
        duration: 5000,
      })
    }
    previousUnreadCountRef.current = unreadCount
  }, [unreadCount])

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f3faf1]">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content flex-1 overflow-y-auto px-2.5 py-3 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
