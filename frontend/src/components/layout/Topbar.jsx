import { Bell, Search, X } from 'lucide-react'
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

export default function Topbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { notifications, projects, documents } = useAppStore()
  const unread = notifications.filter(n => !n.isRead).length

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

  const hasResults = searchResults.projects.length > 0 || searchResults.customers.length > 0 || searchResults.users.length > 0

  const handleSelect = (path) => {
    navigate(path)
    setQuery('')
    setShowResults(false)
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
        {showResults && query.trim().length >= 2 && (
          <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            {isSearching ? (
              <p className="text-xs text-gray-400 px-4 py-3">Mencari...</p>
            ) : !hasResults ? (
              <p className="text-xs text-gray-400 px-4 py-3">Tidak ada hasil untuk "{query}"</p>
            ) : (
              <>
                {searchResults.projects.length > 0 && (
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
                {searchResults.customers.length > 0 && (
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
                {searchResults.users.length > 0 && (
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

      {/* Right */}
      <div className="flex items-center gap-4">
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
            <p className="text-xs text-gray-400">{getRoleDisplayName(user?.role)}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
