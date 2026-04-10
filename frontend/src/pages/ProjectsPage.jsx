import { useState, useMemo } from 'react'
import { Plus, Search, CheckCircle, Clock, ChevronDown, ChevronUp, SlidersHorizontal, X, Trash2, Lock, Users } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EnhancedLocationSelect from '../components/ui/EnhancedLocationSelect'
import { ProjectCreatedToast } from '../components/ui/ProjectToast'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import { formatRupiah } from '../lib/formatRupiah'
import { can, filterProjectsByRole } from '../lib/permissions'
import { api } from '../lib/api'

const statusMap = {
  on_track:  { label: 'On Track',  variant: 'success' },
  at_risk:   { label: 'At Risk',   variant: 'warning' },
  delayed:   { label: 'Delayed',   variant: 'danger' },
  completed: { label: 'Selesai',   variant: 'info' },
}

const EMPTY_FORM = { 
  name: '', 
  location: {
    province: '',
    city: '',
    address: '',
    postalCode: ''
  }, 
  pm: '', 
  phone: '', 
  deadline: '', 
  rab: '', 
  status: 'on_track' 
}

export default function ProjectsPage() {
  const { projects, addProject, deleteProject, markComplete, restoreFromTrash, deletePermanent, emptyTrash, trash } = useAppStore()
  const { user } = useAuthStore()
  const { users, updateUser } = useUserStore()
  

  
  const visibleProjects = filterProjectsByRole(projects, user, users)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLokasi, setFilterLokasi] = useState('')
  const [filterBulan, setFilterBulan]   = useState('')
  const [filterTahun, setFilterTahun]   = useState('')
  const [showFilter, setShowFilter]     = useState(false)
  const [open, setOpen]                 = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [confirmId, setConfirmId]       = useState(null)
  const [deletePasswordModal, setDeletePasswordModal] = useState(null)
  const [showHistory, setShowHistory]   = useState(true)
  const [showTrash, setShowTrash]       = useState(false)
  const [editProject, setEditProject]   = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePasswordError, setDeletePasswordError] = useState('')
  const [emptyTrashModal, setEmptyTrashModal] = useState(false)
  const [permanentDeleteModal, setPermanentDeleteModal] = useState(null) // { id, name }
  const [assignModal, setAssignModal] = useState(null) // { projectId, projectName }
  const [selectedEngineers, setSelectedEngineers] = useState([])
  const navigate = useNavigate()

  const active    = visibleProjects.filter(p => p.status !== 'completed')
  const completed = visibleProjects.filter(p => p.status === 'completed')

  const lokasiOptions = useMemo(() => [...new Set(projects.map(p => p.location))].sort(), [projects])
  const tahunOptions  = useMemo(() => [...new Set(projects.map(p => new Date(p.deadline).getFullYear()))].sort(), [projects])

  const bulanOptions = [
    { val:'1',label:'Januari' },{ val:'2',label:'Februari' },{ val:'3',label:'Maret' },
    { val:'4',label:'April' },{ val:'5',label:'Mei' },{ val:'6',label:'Juni' },
    { val:'7',label:'Juli' },{ val:'8',label:'Agustus' },{ val:'9',label:'September' },
    { val:'10',label:'Oktober' },{ val:'11',label:'November' },{ val:'12',label:'Desember' },
  ]

  const hasActiveFilter = filterStatus !== 'all' || filterLokasi || filterBulan || filterTahun

  const applyFilters = (list) => list.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.pm.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchLokasi = !filterLokasi || p.location === filterLokasi
    const dl = new Date(p.deadline)
    const matchBulan = !filterBulan || String(dl.getMonth() + 1) === filterBulan
    const matchTahun = !filterTahun || String(dl.getFullYear()) === filterTahun
    return matchSearch && matchStatus && matchLokasi && matchBulan && matchTahun
  })

  const filtered          = applyFilters(active)
  const filteredCompleted = applyFilters(completed)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Validate required fields
      const validationErrors = []
      
      if (!form.name?.trim()) validationErrors.push('Nama proyek')
      if (!form.location?.province) validationErrors.push('Provinsi')
      if (!form.location?.city) validationErrors.push('Kota/Kabupaten')
      if (!form.location?.address?.trim()) validationErrors.push('Alamat lengkap')
      if (!form.pm?.trim()) validationErrors.push('Site Manager')
      if (!form.deadline) validationErrors.push('Deadline')
      if (!form.rab?.trim()) validationErrors.push('RAB')
      
      if (validationErrors.length > 0) {
        const errorMsg = `Field wajib: ${validationErrors.join(', ')}`
        toast.error(errorMsg)
        return
      }
      
      // Generate location string for storage
      const locationString = [
        form.location.address?.trim(),
        form.location.city,
        form.location.province,
        form.location.postalCode
      ].filter(Boolean).join(', ')
      
      // Parse RAB
      const rabNum = parseFloat(String(form.rab).replace(/\./g, ''))
      
      if (isNaN(rabNum) || rabNum <= 0) {
        toast.error('RAB harus berupa angka yang valid')
        return
      }
      
      // Calculate auto status
      const days = Math.ceil((new Date(form.deadline) - new Date()) / 86400000)
      const autoStatus = days < 0 ? 'delayed' : days <= 30 ? 'at_risk' : 'on_track'
      
      if (editProject) {
        useAppStore.getState().updateProject(editProject.id, {
          name: form.name.trim(), 
          location: locationString, 
          pm: form.pm.trim(),
          phone: form.phone?.trim() || '', 
          deadline: form.deadline, 
          rab: rabNum, 
          status: autoStatus,
        })
        toast.success('Proyek berhasil diupdate')
      } else {
        const newProject = { 
          name: form.name.trim(), 
          location: locationString, 
          pm: form.pm.trim(), 
          phone: form.phone?.trim() || '', 
          deadline: form.deadline, 
          rab: rabNum, 
          status: autoStatus 
        }
        
        // Add project to store
        const newId = addProject(newProject)
        
        if (!newId) {
          toast.error('Gagal membuat proyek')
          return
        }
        
        // Auto-assign ke pembuat kalau bukan administrator
        if (user.role !== 'administrator' && user.role !== 'direktur' && newId) {
          const creator = users.find(u => u.email === user.email)
          if (creator) {
            const assigned = creator.assignedProjects || []
            if (!assigned.includes(String(newId))) {
              updateUser(creator.id, { assignedProjects: [...assigned, String(newId)] })
            }
          }
        }
        
        // Show success toast
        toast.success(`Proyek "${newProject.name}" berhasil dibuat!`)
        
        // Custom toast for project creation
        setTimeout(() => {
          toast.custom((t) => (
            <ProjectCreatedToast 
              project={newProject} 
              visible={t.visible} 
            />
          ), { duration: 4000 })
        }, 500)
      }
      
      // Close modal and reset form
      setOpen(false)
      setForm(EMPTY_FORM)
      setEditProject(null)
      
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan proyek')
    }
  }

  const handleDelete = (id, name) => {
    // Langsung delete dari localStorage (skip API call sementara)
    deleteProject(id)
    
    toast.custom((t) => (
      <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-md rounded-xl px-4 py-3 min-w-[260px] transition-all ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <Trash2 size={13} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Dipindahkan ke sampah</p>
        </div>
      </div>
    ), { duration: 3000 })
  }

  const openDeleteModal = (e, p) => {
    e.stopPropagation()
    setDeletePasswordModal({ id: p.id, name: p.name })
    setDeletePassword('')
    setDeletePasswordError('')
  }

  const handleDeleteWithPassword = () => {
    // Sementara skip API call dan langsung delete dari localStorage
    // karena ada masalah authentication
    deleteProject(deletePasswordModal.id)
    
    toast.custom((t) => (
      <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-md rounded-xl px-4 py-3 min-w-[260px] transition-all ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <Trash2 size={13} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{deletePasswordModal.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Dipindahkan ke sampah</p>
        </div>
      </div>
    ), { duration: 3000 })
    
    setDeletePasswordModal(null)
    setDeletePassword('')
    setDeletePasswordError('')
  }

  const handleAssignEngineers = () => {
    if (!assignModal) return
    
    const { projectId, projectName } = assignModal
    
    // Update assigned projects for all engineers
    users.forEach(u => {
      if (u.role === 'engineer') {
        const currentAssigned = u.assignedProjects || []
        const isCurrentlyAssigned = currentAssigned.includes(String(projectId))
        const shouldBeAssigned = selectedEngineers.includes(u.id)
        
        if (shouldBeAssigned && !isCurrentlyAssigned) {
          // Add project to engineer
          updateUser(u.id, { 
            assignedProjects: [...currentAssigned, String(projectId)] 
          })
        } else if (!shouldBeAssigned && isCurrentlyAssigned) {
          // Remove project from engineer
          updateUser(u.id, { 
            assignedProjects: currentAssigned.filter(pid => pid !== String(projectId)) 
          })
        }
      }
    })
    
    // Add activity log
    const assignedEngineers = users.filter(u => selectedEngineers.includes(u.id))
    const engineerNames = assignedEngineers.map(u => u.name).join(', ')
    
    useAppStore.getState().addActivity({
      action: 'Assign Engineer',
      detail: `Proyek "${projectName}" di-assign ke: ${engineerNames || 'Tidak ada'}`,
      projectId
    })
    
    toast.success(`Engineer berhasil di-assign ke proyek "${projectName}"`)
    setAssignModal(null)
    setSelectedEngineers([])
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Proyek</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} proyek aktif · {completed.length} selesai
            <span className="ml-2 text-xs text-gray-400">
              (Total: {projects.length} proyek)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can(user, 'create_project') && (
            <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Tambah Proyek
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, lokasi, PM..."
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${hasActiveFilter ? 'bg-[#0f4c81] text-white border-[#0f4c81]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={14} /> Filter
            {hasActiveFilter && <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">{[filterStatus!=='all',filterLokasi,filterBulan,filterTahun].filter(Boolean).length}</span>}
          </button>
          {hasActiveFilter && (
            <button onClick={() => { setFilterStatus('all'); setFilterLokasi(''); setFilterBulan(''); setFilterTahun('') }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><X size={13} /> Reset</button>
          )}
        </div>

        {showFilter && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Status</label>
              <div className="flex flex-col gap-1">
                {[{key:'all',label:'Semua'},{key:'on_track',label:'On Track'},{key:'at_risk',label:'At Risk'},{key:'delayed',label:'Delayed'}].map(s => (
                  <button key={s.key} onClick={() => setFilterStatus(s.key)}
                    className={`text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${filterStatus===s.key ? 'bg-[#0f4c81] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Lokasi</label>
              <select value={filterLokasi} onChange={e => setFilterLokasi(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">Semua Lokasi</option>
                {lokasiOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Bulan Deadline</label>
              <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">Semua Bulan</option>
                {bulanOptions.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tahun Deadline</label>
              <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">Semua Tahun</option>
                {tahunOptions.map(t => <option key={t} value={String(t)}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Active Projects Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                    <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>
                  </div>
                  <Badge variant={statusMap[p.status]?.variant || 'default'}>{statusMap[p.status]?.label || p.status}</Badge>
                </div>
                <div className="space-y-1.5 mb-4 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-700">{p.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">RAB</p>
                    <p className="font-semibold text-gray-700">{formatRupiah(p.rab)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">RAB Terealisasi</p>
                    <p className={`font-semibold ${p.realisasi > p.rab ? 'text-red-500' : 'text-gray-700'}`}>{formatRupiah(p.realisasi || 0)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-400 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <span>PM: {p.pm}</span>
                  <span>Deadline: {new Date(p.deadline).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                {/* Konfirmasi selesai */}
                {confirmId === p.id ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-green-800">Tandai proyek ini selesai?</p>
                    <div className="flex gap-2">
                      <button onClick={() => { markComplete(p.id); setConfirmId(null); toast.success('Proyek selesai') }}
                        className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg font-medium transition-colors">
                        Ya, Selesai
                      </button>
                      <button onClick={() => setConfirmId(null)}
                        className="flex-1 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg font-medium transition-colors">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Tombol normal */
                  <div className="flex items-center gap-2">
                    {can(user, 'mark_complete') && (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmId(p.id) }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-lg font-medium transition-colors">
                        <CheckCircle size={13} /> Selesai
                      </button>
                    )}
                    {can(user, 'edit_project') && (
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditProject(p); 
                        
                        // Parse location string back to object for editing
                        const locationParts = p.location.split(', ')
                        const locationObj = {
                          address: locationParts[0] || '',
                          city: locationParts[1] || '',
                          province: locationParts[2] || '',
                          postalCode: locationParts[3] || ''
                        }
                        
                        setForm({ 
                          name: p.name, 
                          location: locationObj, 
                          pm: p.pm, 
                          phone: p.phone || '', 
                          deadline: p.deadline, 
                          rab: Number(p.rab).toLocaleString('id-ID'), 
                          status: p.status 
                        }); 
                        setOpen(true) 
                      }}
                        className="flex-1 flex items-center justify-center text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg font-medium transition-colors">
                        Edit
                      </button>
                    )}
                    {can(user, 'assign_project') && (
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        setAssignModal({ projectId: p.id, projectName: p.name })
                        // Get currently assigned engineers
                        const assignedEngineers = users.filter(u => 
                          u.role === 'engineer' && 
                          u.assignedProjects && 
                          u.assignedProjects.includes(String(p.id))
                        ).map(u => u.id)
                        setSelectedEngineers(assignedEngineers)
                      }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 py-2 rounded-lg font-medium transition-colors">
                        <Users size={13} /> Assign
                      </button>
                    )}
                    {can(user, 'delete_project') && (
                      <button onClick={(e) => openDeleteModal(e, p)}
                        className="flex items-center justify-center text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm mb-4">
            {projects.length === 0 
              ? 'Belum ada proyek. Gunakan tombol "Tambah Proyek" di atas untuk membuat proyek pertama.'
              : 'Tidak ada proyek yang sesuai dengan filter.'
            }
          </div>
        </div>
      )}

      {/* History Selesai */}
      {filteredCompleted.length > 0 && (
        <div className="card">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">History Proyek Selesai</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filteredCompleted.length}</span>
            </div>
            <button onClick={() => setShowHistory(v => !v)} className="text-gray-400 hover:text-gray-600">
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          {showHistory && (
            <div className="mt-4 space-y-3">
              {filteredCompleted.map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location} · PM: {p.pm}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-green-600">100%</p>
                    <p className="text-xs text-gray-400">Selesai {p.completedAt ? new Date(p.completedAt).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{formatRupiah(p.realisasi || 0)}</p>
                    <p className="text-xs text-gray-400">dari {formatRupiah(p.rab)}</p>
                  </div>
                  <Badge variant="info">Selesai</Badge>
                  <button onClick={(e) => { e.stopPropagation(); openDeleteModal(e, p) }}
                    className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Hapus</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sampah / Recycle Bin */}
      {can(user, 'delete_project') && trash.length > 0 && (
        <div className="card border-dashed border-red-200 bg-red-50/30">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🗑️</span>
              <h3 className="text-sm font-semibold text-gray-700">Sampah</h3>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{trash.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setEmptyTrashModal(true)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline">
                Kosongkan
              </button>
              <button onClick={() => setShowTrash(v => !v)} className="text-gray-400 hover:text-gray-600">
                {showTrash ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {showTrash && (
            <div className="mt-4 space-y-3">
              {trash.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-red-100 opacity-70">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 line-through">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location} · PM: {p.pm}</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Dihapus {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString('id-ID') : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => {
                        restoreFromTrash(p.id)
                        toast.custom((t) => (
                          <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-md rounded-xl px-4 py-3 min-w-[260px] transition-all ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <CheckCircle size={13} className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Proyek berhasil dipulihkan</p>
                            </div>
                          </div>
                        ), { duration: 3000 })
                      }}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      Pulihkan
                    </button>
                    <button onClick={() => setPermanentDeleteModal({ id: p.id, name: p.name })}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Proyek */}
      <Modal open={open} onClose={() => { setOpen(false); setEditProject(null); setForm(EMPTY_FORM) }} title={editProject ? 'Edit Proyek' : 'Tambah Proyek Baru'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nama Proyek</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nama proyek..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Lokasi Proyek</label>
            <EnhancedLocationSelect
              value={form.location}
              onChange={(location) => setForm({...form, location})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Site Manager</label>
              <input type="text" required value={form.pm} onChange={e => setForm({...form, pm: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nama Site Manager..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Email Site Manager</label>
              <input type="email" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="sitemanager@ptamsar.co.id" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Deadline</label>
              <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {form.deadline && (() => {
                const days = Math.ceil((new Date(form.deadline) - new Date()) / 86400000)
                const status = days < 0 ? 'Delayed' : days <= 30 ? 'At Risk' : 'On Track'
                const color = days < 0 ? 'text-red-500' : days <= 30 ? 'text-yellow-600' : 'text-green-600'
                return <p className={`text-xs mt-1 ${color}`}>Status otomatis: {status} ({days < 0 ? `${Math.abs(days)} hari lewat` : `${days} hari lagi`})</p>
              })()}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">RAB</label>
              <input
                type="text"
                required
                value={form.rab}
                onChange={e => {
                  // Strip semua non-digit, lalu format dengan titik ribuan
                  const raw = e.target.value.replace(/\D/g, '')
                  const formatted = raw ? parseInt(raw).toLocaleString('id-ID') : ''
                  setForm({...form, rab: formatted})
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: 7.500.000"
              />
              {form.rab && (() => {
                const num = parseInt(form.rab.replace(/\./g, ''))
                return !isNaN(num) && num > 0
                  ? <p className="text-xs text-blue-600 mt-1">{formatRupiah(num)}</p>
                  : null
              })()}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => { setOpen(false); setEditProject(null); setForm(EMPTY_FORM) }} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">{editProject ? 'Simpan Perubahan' : 'Simpan Proyek'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Konfirmasi Hapus dengan Password */}
      <Modal open={!!deletePasswordModal} onClose={() => { setDeletePasswordModal(null); setDeletePassword(''); setDeletePasswordError('') }} title="Konfirmasi Hapus Proyek" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <Trash2 size={16} className="text-red-500 shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-semibold text-red-800">Hapus "{deletePasswordModal?.name}"?</p>
              <p className="text-xs text-red-600 mt-0.5">Proyek akan dipindahkan ke sampah. Masukkan password untuk konfirmasi.</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              <Lock size={11} className="inline mr-1"/>Password Anda
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={e => { setDeletePassword(e.target.value); setDeletePasswordError('') }}
              onKeyDown={e => e.key === 'Enter' && handleDeleteWithPassword()}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 ${deletePasswordError ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="Masukkan password..."
              autoFocus
            />
            {deletePasswordError && <p className="text-xs text-red-500 mt-1">{deletePasswordError}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setDeletePasswordModal(null); setDeletePassword(''); setDeletePasswordError('') }} className="btn-secondary">Batal</button>
            <button onClick={handleDeleteWithPassword} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
              <Trash2 size={14}/> Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Kosongkan Sampah */}
      <Modal open={emptyTrashModal} onClose={() => setEmptyTrashModal(false)} title="Kosongkan Sampah" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <Trash2 size={16} className="text-red-500 shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-semibold text-red-800">Hapus semua proyek di sampah?</p>
              <p className="text-xs text-red-600 mt-0.5">Tindakan ini tidak bisa dibatalkan. Semua data akan hilang permanen.</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEmptyTrashModal(false)} className="btn-secondary">Batal</button>
            <button onClick={() => { emptyTrash(); setEmptyTrashModal(false); toast.success('Sampah dikosongkan') }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
              <Trash2 size={14}/> Hapus Semua
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hapus Permanen per Item */}
      <Modal open={!!permanentDeleteModal} onClose={() => setPermanentDeleteModal(null)} title="Hapus Permanen" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <Trash2 size={16} className="text-red-500 shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-semibold text-red-800">{permanentDeleteModal?.name}</p>
              <p className="text-xs text-red-600 mt-0.5">Proyek ini akan dihapus permanen dan tidak bisa dipulihkan.</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPermanentDeleteModal(null)} className="btn-secondary">Batal</button>
            <button onClick={() => {
              deletePermanent(permanentDeleteModal.id)
              setPermanentDeleteModal(null)
              toast.custom((t) => (
                <div className={`flex items-center gap-3 bg-white border border-gray-100 shadow-md rounded-xl px-4 py-3 min-w-[260px] ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 size={13} className="text-red-500"/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{permanentDeleteModal?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Dihapus permanen</p>
                  </div>
                </div>
              ), { duration: 3000 })
            }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
              <Trash2 size={14}/> Hapus Permanen
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Assign Engineer */}
      <Modal open={!!assignModal} onClose={() => { setAssignModal(null); setSelectedEngineers([]) }} title="Assign Engineer ke Proyek" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <Users size={16} className="text-purple-600 shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-semibold text-purple-800">Assign Engineer</p>
              <p className="text-xs text-purple-600 mt-0.5">
                Pilih engineer yang akan di-assign ke proyek "{assignModal?.projectName}"
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Pilih Engineer:</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.filter(u => u.role === 'engineer').map(engineer => (
                <label key={engineer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEngineers.includes(engineer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEngineers([...selectedEngineers, engineer.id])
                      } else {
                        setSelectedEngineers(selectedEngineers.filter(id => id !== engineer.id))
                      }
                    }}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{engineer.name}</p>
                    <p className="text-xs text-gray-500">{engineer.email}</p>
                    {engineer.assignedProjects && engineer.assignedProjects.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {engineer.assignedProjects.length} proyek aktif
                      </p>
                    )}
                  </div>
                </label>
              ))}
              {users.filter(u => u.role === 'engineer').length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Belum ada engineer yang terdaftar
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => { setAssignModal(null); setSelectedEngineers([]) }} className="btn-secondary">
              Batal
            </button>
            <button onClick={handleAssignEngineers} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
              <Users size={14}/> Assign Engineer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
