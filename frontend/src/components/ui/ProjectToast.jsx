import { CheckCircle, FolderPlus, AlertTriangle, Info } from 'lucide-react'

/**
 * Custom toast components for project-related notifications
 */

export function ProjectCreatedToast({ project, visible }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 min-w-[300px] transition-all ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <FolderPlus size={16} className="text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{project.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Proyek baru di {project.location} berhasil dibuat
        </p>
      </div>
      <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
    </div>
  )
}

export function ProjectCompletedToast({ project, visible }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 min-w-[300px] transition-all ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <CheckCircle size={16} className="text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{project.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Proyek telah selesai 100%
        </p>
      </div>
      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
    </div>
  )
}

export function MaterialCompletedToast({ material, project, visible }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 min-w-[300px] transition-all ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <CheckCircle size={16} className="text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{material.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Material di {project.name} selesai 100%
        </p>
      </div>
      <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
    </div>
  )
}

export function MaterialWarningToast({ material, project, percentage, visible }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 min-w-[300px] transition-all ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
        <AlertTriangle size={16} className="text-orange-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{material.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {percentage}% terpasang di {project.name}
        </p>
      </div>
      <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0"></div>
    </div>
  )
}

export function DocumentUploadedToast({ document, project, visible }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 min-w-[300px] transition-all ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Info size={16} className="text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{document.type}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {document.name} untuk {project.name}
        </p>
      </div>
      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
    </div>
  )
}