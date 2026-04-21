import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function ServerStatus() {
  const [serverStatus, setServerStatus] = useState('checking')
  const [lastCheck, setLastCheck] = useState(null)

  const checkServer = async () => {
    setServerStatus('checking')
    try {
      const isOnline = await api.checkServerStatus()
      setServerStatus(isOnline ? 'online' : 'offline')
      setLastCheck(new Date().toLocaleTimeString())
    } catch (error) {
      setServerStatus('offline')
      setLastCheck(new Date().toLocaleTimeString())
    }
  }

  useEffect(() => {
    checkServer()
    const interval = setInterval(checkServer, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (serverStatus === 'online') return null // Don't show when everything is working

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg border ${
        serverStatus === 'checking' 
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            serverStatus === 'checking' 
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {serverStatus === 'checking' 
              ? 'Checking server...'
              : 'Server offline'
            }
          </span>
          <button 
            onClick={checkServer}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
        {lastCheck && (
          <p className="text-xs mt-1 opacity-75">
            Last check: {lastCheck}
          </p>
        )}
        {serverStatus === 'offline' && (
          <div className="mt-2 text-xs">
            <p>Laravel server tidak berjalan.</p>
            <p>Jalankan: <code className="bg-black/10 px-1 rounded">php artisan serve</code></p>
          </div>
        )}
      </div>
    </div>
  )
}