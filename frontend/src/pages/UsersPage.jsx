import { useState, useEffect } from 'react'
import { Plus, Trash2, UserCheck, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'
import useAppStore from '../store/appStore'
import { api } from '../lib/api'

const roleLabel = { 
  administrator: 'Administrator', 
  site_manager: 'Site Manager', 
  engineer: 'Engineer', 
  sales: 'Sales',
  direktur: 'Administrator' 
}

const roleVariant = { 
  administrator: 'info', 
  site_manager: 'success', 
  engineer: 'default', 
  sales: 'success',
  direktur: 'info' 
}

const divisionLabel = {
  site_manager: 'Site Manager Division',
  site_manager: 'Site Manager Division'
}

const EMPTY = { name: '', email: '', password: '', role: 'site_manager', division: 'site_manager', assignedProjects: [] }

export default function UsersPage() {
  const { projects } = useAppStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]         = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [selUser, setSelUser]   = useState(null)

  // Fetch users from API
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.getUsers()
      console.log('Users API response:', response) // Debug log
      if (response && (response.data || Array.isArray(response))) {
        setUsers(response.data || response)
      } else {
        console.error('Unexpected response format:', response)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Gagal memuat data user')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { 
      toast.error('Semua field wajib diisi')
      return 
    }
    if (users.find(u => u.email === form.email)) { 
      toast.error('Email sudah digunakan')
      return 
    }
    
    try {
      console.log('Creating user with data:', form) // Debug log
      const response = await api.createUser(form)
      console.log('Create user response:', response) // Debug log
      if (response && (response.data || response.id)) {
        toast.success('User berhasil ditambahkan')
        setOpen(false)
        setForm(EMPTY)
        fetchUsers() // Refresh the list
      } else {
        console.error('Unexpected create response:', response)
        toast.error('Gagal menambahkan user - response tidak valid')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Gagal menambahkan user')
    }
  }

  const handleDelete = async (u) => {
    if (u.role === 'administrator' || u.role === 'direktur') { 
      toast.error('Akun administrator tidak bisa dihapus')
      return 
    }
    
    try {
      console.log('Deleting user:', u.id) // Debug log
      const response = await api.deleteUser(u.id)
      console.log('Delete user response:', response) // Debug log
      if (response && (response.message || response.success !== false)) {
        toast.success('User berhasil dihapus')
        fetchUsers() // Refresh the list
      } else {
        console.error('Unexpected delete response:', response)
        toast.error('Gagal menghapus user - response tidak valid')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Gagal menghapus user')
    }
  }

  const toggleAssign = async (projectId) => {
    if (!selUser) return
    
    try {
      console.log('Assigning project:', projectId, 'to user:', selUser.id) // Debug log
      const response = await api.assignProject(selUser.id, projectId)
      console.log('Assign project response:', response) // Debug log
      if (response && (response.data || response.id)) {
        // Update local state
        const updatedUser = response.data || response
        setSelUser(updatedUser)
        // Update users list
        setUsers(prev => prev.map(u => u.id === selUser.id ? updatedUser : u))
        toast.success('Assignment berhasil diupdate')
      } else {
        console.error('Unexpected assign response:', response)
        toast.error('Gagal mengupdate assignment - response tidak valid')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error(error.message || 'Gagal mengupdate assignment')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Memuat...' : `${users.length} user terdaftar`}
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15}/> Tambah User
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            Memuat data user...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Nama','Email','Role','Divisi','Proyek Assigned','Aksi'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant={roleVariant[u.role]}>{roleLabel[u.role]}</Badge></td>
                  <td className="px-4 py-3">
                    {u.division ? (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {divisionLabel[u.division] || u.division}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(u.role === 'administrator' || u.role === 'direktur')
                      ? <span className="text-xs text-gray-400">Semua proyek</span>
                      : (
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            // Pastikan assignedProjects adalah array
                            let assignedProjects = u.assignedProjects || []
                            if (typeof assignedProjects === 'string') {
                              try {
                                assignedProjects = JSON.parse(assignedProjects)
                              } catch (e) {
                                assignedProjects = []
                              }
                            }
                            if (!Array.isArray(assignedProjects)) {
                              assignedProjects = []
                            }
                            
                            return assignedProjects.length === 0
                              ? <span className="text-xs text-gray-400">Belum ada</span>
                              : assignedProjects.map(pid => {
                                  const p = projects.find(pr => String(pr.id) === String(pid))
                                  return p ? <span key={pid} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.name}</span> : null
                                })
                          })()}
                          <button onClick={() => { setSelUser(u); setAssignOpen(true) }}
                            className="text-xs text-[#0f4c81] hover:underline flex items-center gap-1">
                            <UserCheck size={12}/> Assign
                          </button>
                        </div>
                      )
                    }
                  </td>
                  <td className="px-4 py-3">
                    {(u.role !== 'administrator' && u.role !== 'direktur') && (
                      <button onClick={() => handleDelete(u)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Belum ada user terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah User */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah User Baru" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nama Lengkap</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nama user..."/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="email@ptamsar.co.id"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Min. 6 karakter"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="site_manager">Site Manager</option>
              <option value="engineer">Engineer</option>
              <option value="sales">Sales</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Divisi</label>
            <select value={form.division} onChange={e => setForm({...form, division: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">Pilih Divisi</option>
              <option value="site_manager">Site Manager Division</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* Modal Assign Proyek */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign Proyek — ${selUser?.name}`} size="md">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Pilih proyek yang bisa diakses oleh user ini:</p>
          {projects.filter(p => p.status !== 'completed').map(p => {
            // Pastikan assignedProjects adalah array
            let assignedProjects = selUser?.assignedProjects || []
            if (typeof assignedProjects === 'string') {
              try {
                assignedProjects = JSON.parse(assignedProjects)
              } catch (e) {
                assignedProjects = []
              }
            }
            if (!Array.isArray(assignedProjects)) {
              assignedProjects = []
            }
            
            const assigned = assignedProjects.includes(String(p.id))
            return (
              <div key={p.id} onClick={() => toggleAssign(p.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${assigned ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.location} · PM: {p.pm}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${assigned ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {assigned && <div className="w-2 h-2 bg-white rounded-full"/>}
                </div>
              </div>
            )
          })}
          {projects.filter(p => p.status !== 'completed').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada proyek aktif</p>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={() => setAssignOpen(false)} className="btn-primary">Selesai</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
