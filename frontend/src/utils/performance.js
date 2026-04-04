import { useMemo, useCallback } from 'react'

/**
 * Performance utilities for React components
 */

// Debounce hook for search inputs
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Memoized filter function
export function useFilteredData(data, filters, searchTerm) {
  return useMemo(() => {
    if (!data?.length) return []
    
    return data.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const searchableFields = ['name', 'location', 'pm', 'email']
        const matchesSearch = searchableFields.some(field => 
          item[field]?.toLowerCase().includes(searchLower)
        )
        if (!matchesSearch) return false
      }
      
      // Other filters
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true
        
        if (key === 'status') return item.status === value
        if (key === 'location') return item.location === value
        if (key === 'month') {
          const itemMonth = new Date(item.deadline).getMonth() + 1
          return String(itemMonth) === value
        }
        if (key === 'year') {
          const itemYear = new Date(item.deadline).getFullYear()
          return String(itemYear) === value
        }
        
        return true
      })
    })
  }, [data, filters, searchTerm])
}

// Memoized sort function
export function useSortedData(data, sortConfig) {
  return useMemo(() => {
    if (!data?.length || !sortConfig.key) return data
    
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    
    return sorted
  }, [data, sortConfig])
}

// Optimized event handlers
export function useOptimizedHandlers(dependencies = []) {
  return useMemo(() => ({
    handleSearch: useCallback((value) => {
      // Search logic
    }, dependencies),
    
    handleFilter: useCallback((key, value) => {
      // Filter logic  
    }, dependencies),
    
    handleSort: useCallback((key) => {
      // Sort logic
    }, dependencies)
  }), dependencies)
}