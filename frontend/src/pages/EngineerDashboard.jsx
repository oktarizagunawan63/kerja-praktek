import { useState, useEffect } from 'react'
import { FolderKanban, TrendingUp, Clock, FileText, Plus, Eye } from '@icons'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import ProgressBar from '../components/kpi/ProgressBar'
import ProjectProgressUpdateModal from '../components/project/ProjectProgressUpdateModal'
import toast from 'react-hot-toast'

export default function EngineerDashboard() {
  const { user } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.getEngineerDashboard()
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgress = (project) => {
    setSelectedProject(project)
    setShowProgressModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.stats || {}
  const assignedProjects = dashboardData?.assigned_projects || []
  const recentReports = dashboardData?.recent_reports || []

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#de168c]">Dashboard Engineer</h1>
        <p className="text-[#de168c]">Selamat datang, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderKanban className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-[#de168c]">Total Proyek</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_projects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-[#de168c]">Proyek Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed_projects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-[#de168c]">Sedang Berjalan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.in_progress_projects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-[#de168c]">Total Laporan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_reports || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Projects */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#de168c]">Proyek yang Ditugaskan</h2>
          </div>
          <div className="p-6">
            {assignedProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500">Belum ada proyek yang ditugaskan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedProjects.map(project => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-600">{project.location}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateProgress(project)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus size={14} />
                        Update Progress
                      </Button>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress || 0}%</span>
                      </div>
                      <ProgressBar progress={project.progress || 0} />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Deadline: {new Date(project.end_date).toLocaleDateString('id-ID')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'delayed' ? 'bg-red-100 text-red-700' :
                        project.status === 'at_risk' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {project.status === 'completed' ? 'Selesai' :
                         project.status === 'delayed' ? 'Terlambat' :
                         project.status === 'at_risk' ? 'Berisiko' : 'On Track'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Progress Reports */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#de168c]">Laporan Progress Terbaru</h2>
          </div>
          <div className="p-6">
            {recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500">Belum ada laporan progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map(report => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{report.project?.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(report.reported_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {report.progress_percentage}%
                      </span>
                    </div>
                    {report.notes && (
                      <p className="text-sm text-gray-700 mb-2">{report.notes}</p>
                    )}
                    {report.photo && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Eye size={14} />
                        <span>Foto dilampirkan</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectProgressUpdateModal
        open={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        project={selectedProject}
        initialProgress={selectedProject?.engineer_progress_reports?.[0]?.progress_percentage || selectedProject?.progress || 0}
        onSaved={() => {
          setShowProgressModal(false)
          fetchDashboardData()
        }}
      />
    </div>
  )
}
