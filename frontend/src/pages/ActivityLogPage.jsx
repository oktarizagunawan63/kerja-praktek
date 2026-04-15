import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch activity logs from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getActivityLogs()
        setActivities(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching activity logs:', error)
        setError(error.message || 'Gagal memuat activity log')
        toast.error('Gagal memuat activity log')
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <div className="card p-8 text-center text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          Memuat activity log...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <div className="card p-8 text-center text-red-500">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <span className="text-xs text-gray-400">{activities.length} aktivitas</span>
      </div>

      <div className="card">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-medium text-gray-700">Pengguna</th>
                  <th className="text-left p-3 font-medium text-gray-700">Role</th>
                  <th className="text-left p-3 font-medium text-gray-700">Aktivitas</th>
                  <th className="text-left p-3 font-medium text-gray-700">Detail</th>
                  <th className="text-left p-3 font-medium text-gray-700">Proyek</th>
                  <th className="text-left p-3 font-medium text-gray-700">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr key={activity.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-medium text-gray-800">{activity.user || '-'}</span>
                    </td>
                    <td className="p-3 text-gray-600">{activity.role || '-'}</td>
                    <td className="p-3 text-gray-600">{activity.action || '-'}</td>
                    <td className="p-3 text-gray-600">{activity.detail || '-'}</td>
                    <td className="p-3 text-gray-600">{activity.project || '-'}</td>
                    <td className="p-3 text-gray-600">{activity.time || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
