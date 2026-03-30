import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

export default function FileUpload({ onFilesChange, accept, maxFiles = 5, label = 'Upload File' }) {
  const [files, setFiles] = useState([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    onDrop: (accepted) => {
      const updated = [...files, ...accepted].slice(0, maxFiles)
      setFiles(updated)
      onFilesChange?.(updated)
    }
  })

  const remove = (idx) => {
    const updated = files.filter((_, i) => i !== idx)
    setFiles(updated)
    onFilesChange?.(updated)
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-2 text-gray-400" size={24} />
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Drag & drop atau klik untuk memilih file</p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => {
            const isImage = f.type.startsWith('image/')
            const previewUrl = isImage ? URL.createObjectURL(f) : null
            return (
              <li key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                {isImage
                  ? <img src={previewUrl} alt={f.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  : <File size={14} className="text-blue-500 shrink-0" />
                }
                <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
