import { useState, useEffect } from 'react'
import { FolderKanban, Calendar, MapPin, User, Plus } from '@icons'
import { api } from '../lib/api'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import ProgressBar from '../components/kpi/ProgressBar'
import SimpleProgressUpdateModal from '../components/project/SimpleProgressUpdateModal'
import toast from 'react-hot-toast'

export default function EngineerProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

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
    setShowProgressModal(true)
  }

  const getStatusBadge = (status, progress) => {
    // If progress is 100%, always show as completed
    if (progress >= 100 || status === 'completed') {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
          Selesai
        </span>
      )
    }
    
    const statusMap = {
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
      render: (project) => getStatusBadge(project.status, project.progress)
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (project) => {
        const isCompleted = project.status === 'completed' || project.progress >= 100
        
        return isCompleted ? (
          <Button
            size="sm"
            onClick={() => window.location.href = `/engineer/projects/${project.id}`}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Detail
          </Button>
        ) : (
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
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#de168c]">Proyek Saya</h1>
        <p className="text-[#de168c]">Kelola proyek yang ditugaskan kepada Anda</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#de168c]">Daftar Proyek</h2>
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

      <SimpleProgressUpdateModal
        open={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        project={selectedProject}
        onSaved={() => {
          setShowProgressModal(false)
          fetchProjects()
        }}
      />
    </div>
  )
}
