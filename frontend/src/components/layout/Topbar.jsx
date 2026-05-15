import { Bell, LogOut, Menu, Search, X } from '../../lib/icons.jsx'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { getRoleDisplayName } from '../../utils/roleUtils'
import { api } from '../../lib/api'

// Debounce utility function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const unread = useAppStore(state => state.notificationUnreadCount)

  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState({ projects: [], customers: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ projects: [], customers: [], users: [] })
        setIsSearching(false)
        return
      }

      try {
        setIsSearching(true)
        const results = await api.search(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults({ projects: [], customers: [], users: [] })
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { 
      if (!searchRef.current?.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasResults = (searchResults?.projects?.length || 0) > 0 || 
                    (searchResults?.customers?.length || 0) > 0 || 
                    (searchResults?.users?.length || 0) > 0

  const handleSelect = (path) => {
    navigate(path)
    setQuery('')
    setShowResults(false)
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.warn('Logout API error:', error)
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-semibold text-slate-800">PT Amsar Prima Mandiri</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/notifications')}
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#de168c] px-1 text-[10px] font-bold text-white shadow-sm shadow-[#de168c]/30">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#237043] text-xs font-bold text-white">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-medium leading-tight text-slate-800">{user?.name}</p>
                <p className="text-xs text-[#de168c]">{getRoleDisplayName(user?.role)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-[#de168c]/30 hover:bg-[#f399cc]/15 hover:text-[#de168c] sm:px-3"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

      {/* Search */}
      <div className="relative w-full max-w-full lg:max-w-md xl:max-w-lg" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)}
          placeholder="Cari proyek, dokumen..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-800 focus:border-[#de168c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#de168c]/20"
        />
        {query && (
          <button onClick={() => { setQuery(''); setShowResults(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}

        {/* Dropdown results */}
        {showResults && query.trim().length >= 2 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {isSearching ? (
              <p className="text-xs text-gray-400 px-4 py-3">Mencari...</p>
            ) : !hasResults ? (
              <p className="text-xs text-gray-400 px-4 py-3">Tidak ada hasil untuk "{query}"</p>
            ) : (
              <>
                {(searchResults?.projects?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Proyek</p>
                    {searchResults.projects.map(p => (
                      <button key={p.id} onClick={() => handleSelect(p.url)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
                {(searchResults?.customers?.length || 0) > 0 && (
                  <div className="border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Customers</p>
                    {searchResults.customers.map(c => (
                      <button key={c.id} onClick={() => handleSelect(c.url)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
                {(searchResults?.users?.length || 0) > 0 && (
                  <div className="border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Users</p>
                    {searchResults.users.map(u => (
                      <button key={u.id} onClick={() => handleSelect(u.url)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.subtitle} · {u.role}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </header>
  )
}

