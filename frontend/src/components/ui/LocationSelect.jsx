import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, ChevronDown, X, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useAsync } from '../../hooks/useAsync'
import clsx from 'clsx'

/**
 * Location Select Component with AJAX search
 */
export default function LocationSelect({ 
  value, 
  onChange, 
  placeholder = "Pilih lokasi...",
  error,
  disabled = false,
  className = "",
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [provinces, setProvinces] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const { loading, execute } = useAsync()
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await api.getProvinces()
        setProvinces(response.data)
      } catch (err) {
        console.error('Failed to load provinces:', err)
      }
    }
    loadProvinces()
  }, [])

  // Load locations when search or province changes
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const params = {}
        if (search.trim()) params.search = search.trim()
        if (selectedProvince) params.province = selectedProvince
        
        const response = await execute(() => api.getLocations(params))
        setLocations(response.data)
      } catch (err) {
        console.error('Failed to load locations:', err)
        setLocations([])
      }
    }

    if (isOpen) {
      loadLocations()
    }
  }, [search, selectedProvince, isOpen, execute])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (location) => {
    onChange(location.name)
    setIsOpen(false)
    setSearch('')
    setSelectedProvince('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  const selectedLocation = locations.find(loc => loc.name === value)

  return (
    <div className={clsx("relative", className)} ref={dropdownRef}>
      {/* Main Input */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2 text-sm border rounded-lg transition-colors text-left flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-200 hover:border-gray-300'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin size={14} className="text-gray-400 shrink-0" />
          <span className={clsx(
            "truncate",
            value ? "text-gray-900" : "text-gray-500"
          )}>
            {value || placeholder}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown 
            size={14} 
            className={clsx(
              "text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Header */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kota/kabupaten..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
              />
            </div>

            {/* Province Filter */}
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
            >
              <option value="">Semua Provinsi</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 size={16} className="animate-spin mr-2" />
                Memuat lokasi...
              </div>
            ) : locations.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                {search || selectedProvince ? 'Lokasi tidak ditemukan' : 'Ketik untuk mencari lokasi'}
              </div>
            ) : (
              <div className="py-1">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleSelect(location)}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                      'flex items-center justify-between',
                      selectedLocation?.id === location.id && 'bg-blue-50 text-blue-700'
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {location.province}
                      </div>
                    </div>
                    {selectedLocation?.id === location.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}