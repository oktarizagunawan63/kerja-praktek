import { Bell, Search, X, ChevronDown, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

export default function Topbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { notifications, projects, documents } = useAppStore()
  const unread = notifications.filter(n => !n.isRead).length

  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const searchRef = useRef(null)
  const roleSelectorRef = useRef(null)

  // Test users for role switching
  const testUsers = [
    { email: 'sitemanager@ptamsar.co.id', password: 'sitemanager123', role: 'Site Manager', name: 'Site Manager' },
    { email: 'sales1@ptamsar.co.id', password: 'sales123', role: 'Sales 1', name: 'Sales Budi' },
    { email: 'sales2@ptamsar.co.id', password: 'sales123', role: 'Sales 2', name: 'Sales Siti' },
    { email: 'ittimothilois.amsarmedical@gmail.com', password: 'password123', role: 'IT Engineer', name: 'IT Timothy' },
    { email: 'direktur@ptamsar.co.id', password: 'direktur123', role: 'Direktur', name: 'Direktur Utama' }
  ]

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { 
      if (!searchRef.current?.contains(e.target)) setShowResults(false)
      if (!roleSelectorRef.current?.contains(e.target)) setShowRoleSelector(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const q = query.toLowerCase().trim()
  const matchedProjects = q
    ? projects.filter(p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.pm.toLowerCase().includes(q)).slice(0, 4)
    : []
  const matchedDocs = q
    ? (documents || []).filter(d => d.name?.toLowerCase().includes(q)).slice(0, 3)
    : []
  const hasResults = matchedProjects.length > 0 || matchedDocs.length > 0

  const handleSelect = (path) => {
    navigate(path)
    setQuery('')
    setShowResults(false)
  }

  const handleRoleSwitch = async (testUser) => {
    setSwitchingRole(true)
    try {
      // Logout current user
      await logout()
      
      // Login as test user
      const response = await api.login({
        email: testUser.email,
        password: testUser.password
      })
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('amsar-auth', JSON.stringify({
          state: {
            token: response.token,
            user: response.user,
            isAuthenticated: true
          }
        }))
        
        toast.success(`Switched to ${testUser.role}`)
        
        // Reload page to refresh all data
        window.location.reload()
      }
    } catch (error) {
      toast.error(`Failed to switch role: ${error.message}`)
    } finally {
      setSwitchingRole(false)
      setShowRoleSelector(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="relative w-80" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)}
          placeholder="Cari proyek, dokumen..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {query && (
          <button onClick={() => { setQuery(''); setShowResults(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}

        {/* Dropdown results */}
        {showResults && q && (
          <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            {!hasResults ? (
              <p className="text-xs text-gray-400 px-4 py-3">Tidak ada hasil untuk "{query}"</p>
            ) : (
              <>
                {matchedProjects.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Proyek</p>
                    {matchedProjects.map(p => (
                      <button key={p.id} onClick={() => handleSelect(`/projects/${p.id}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.location} · PM: {p.pm}</p>
                      </button>
                    ))}
                  </div>
                )}
                {matchedDocs.length > 0 && (
                  <div className="border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Dokumen</p>
                    {matchedDocs.map(d => (
                      <button key={d.id} onClick={() => handleSelect('/documents')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.type}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Role Selector - Testing Only */}
        <div className="relative" ref={roleSelectorRef}>
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            disabled={switchingRole}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Users size={16} />
            <span>Switch Role</span>
            <ChevronDown size={14} />
          </button>

          {showRoleSelector && (
            <div className="absolute top-full mt-1 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Role Switch</p>
                <p className="text-xs text-gray-400 mt-1">For testing purposes</p>
              </div>
              
              <div className="py-2">
                {testUsers.map((testUser, index) => (
                  <button
                    key={index}
                    onClick={() => handleRoleSwitch(testUser)}
                    disabled={switchingRole}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{testUser.name}</p>
                      <p className="text-xs text-gray-500">{testUser.role}</p>
                    </div>
                    {user?.email === testUser.email && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Current</span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Current: <span className="font-medium">{user?.name}</span> ({user?.role})
                </p>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => navigate('/notifications')}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
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
