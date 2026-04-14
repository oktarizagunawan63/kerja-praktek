import { useState, useEffect } from 'react'
import { FileText, Calendar, Eye, TrendingUp } from 'lucide-react'
import { api } from '../lib/api'
import DataTable from '../components/ui/DataTable'
import toast from 'react-hot-toast'

export default function EngineerProgressReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.getProgressReports()
      if (response.success) {
        setReports(response.data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Gagal memuat laporan progress')
    } finally {
      setLoading(false)
    }
  }

  const getPhotoSrc = (photo) => {
    if (!photo) return null
    if (photo.startsWith('data:image')) return photo
    if (photo.startsWith('http')) return photo
    return `http://127.0.0.1:8000/storage/${photo}`
  }

  const columns = [
    {
      key: 'project',
      label: 'Proyek',
      render: (report) => (
        <div>
          <p className="font-medium text-gray-900">{report.project?.name}</p>
          <p className="text-sm text-gray-500">{report.project?.location}</p>
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (report) => (
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" />
          <span className="font-bold text-blue-600">{report.progress_percentage}%</span>
        </div>
      )
    },
    {
      key: 'notes',
      label: 'Catatan',
      render: (report) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 truncate">
            {report.notes || '-'}
          </p>
        </div>
      )
    },
    {
      key: 'photo',
      label: 'Foto',
      render: (report) => (
        <div>
          {report.photo ? (
            <button
              onClick={() => setSelectedPhoto(getPhotoSrc(report.photo))}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Eye size={14} />
              Lihat Foto
            </button>
          ) : (
            <span className="text-gray-400 text-sm">Tidak ada</span>
          )}
        </div>
      )
    },
    {
      key: 'reported_at',
      label: 'Tanggal Laporan',
      render: (report) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm">
            {new Date(report.reported_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Progress</h1>
        <p className="text-gray-600">Riwayat laporan progress yang telah Anda buat</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Laporan</h2>
            <div className="text-sm text-gray-500">
              Total: {reports.length} laporan
            </div>
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          emptyMessage="Belum ada laporan progress"
        />
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-full">
            <img 
              src={selectedPhoto} 
              alt="Progress Photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}