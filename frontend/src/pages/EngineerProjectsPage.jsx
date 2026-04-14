import { useState, useEffect } from 'react'
import { FolderKanban, Calendar, MapPin, User, Plus } from 'lucide-react'
import { api } from '../lib/api'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import ProgressBar from '../components/kpi/ProgressBar'
import toast from 'react-hot-toast'

export default function EngineerProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [progressForm, setProgressForm] = useState({
    progress_percentage: 0,
    notes: '',
    photo: null
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await api.getEngineerProjects()
      if (response.success) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Gagal memuat data proyek')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgress = (project) => {
    setSelectedProject(project)
    const latestReport = project.engineer_progress_reports?.[0]
    setProgressForm({
      progress_percentage: latestReport?.progress_percentage || project.progress || 0,
      notes: '',
      photo: null
    })
    setShowProgressModal(true)
  }

  const handleSubmitProgress = async () => {
    try {
      const response = await api.submitProgressReport({
        project_id: selectedProject.id,
        ...progressForm
      })
      
      if (response.success) {
        toast.success('Progress berhasil diupdate')
        setShowProgressModal(false)
        fetchProjects()
      }
    } catch (error) {
      toast.error('Gagal mengupdate progress')
    }
  }

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProgressForm(prev => ({ ...prev, photo: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Selesai' },
      'delayed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Terlambat' },
      'at_risk': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Berisiko' },
      'on_track': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'On Track' }
    }
    
    const style = statusMap[status] || statusMap.on_track
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Proyek',
      render: (project) => (
        <div>
          <p className="font-medium text-gray-900">{project.name}</p>
          <p className="text-sm text-gray-500">{project.description}</p>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Lokasi',
      render: (project) => (
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-sm">{project.location}</span>
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (project) => (
        <div className="w-32">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium">{project.progress || 0}%</span>
          </div>
          <ProgressBar progress={project.progress || 0} />
        </div>
      )
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (project) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm">
            {new Date(project.end_date).toLocaleDateString('id-ID')}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (project) => getStatusBadge(project.status)
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (project) => (
        <Button
          size="sm"
          onClick={() => handleUpdateProgress(project)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={14} />
          Update Progress
        </Button>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Proyek Saya</h1>
        <p className="text-gray-600">Kelola proyek yang ditugaskan kepada Anda</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Proyek</h2>
            <div className="text-sm text-gray-500">
              Total: {projects.length} proyek
            </div>
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={projects}
          loading={loading}
          emptyMessage="Belum ada proyek yang ditugaskan"
        />
      </div>

      {/* Progress Update Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Update Progress</h3>
              <p className="text-sm text-gray-600">{selectedProject?.name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Percentage
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressForm.progress_percentage}
                  onChange={(e) => setProgressForm(prev => ({ 
                    ...prev, 
                    progress_percentage: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-medium">{progressForm.progress_percentage}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={progressForm.notes}
                  onChange={(e) => setProgressForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tambahkan catatan progress..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {progressForm.photo && (
                  <div className="mt-2">
                    <img 
                      src={progressForm.photo} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => setShowProgressModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmitProgress}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Simpan Progress
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}