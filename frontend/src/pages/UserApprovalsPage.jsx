import { useState, useEffect } from 'react'
import { UserCheck, UserX, Clock, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import { isDirector, isSiteManager, getRoleDisplayName } from '../utils/roleUtils'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import SuccessModal from '../components/ui/SuccessModal'

export default function UserApprovalsPage() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('pending')
  const [selectedUser, setSelectedUser] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { user: currentUser } = useAuthStore()

  // New modal states
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, user: null })
  const [successModal, setSuccessModal] = useState({ open: false, type: null, user: null, message: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.getUsers(params)
      setUsers(response)
    } catch (err) {
      console.error('Error loading users:', err)
      if (err.status === 401) {
        toast.error('Sesi login telah berakhir. Silakan login kembali.')
        // Redirect to login or handle auth error
      } else {
        toast.error(err.message || 'Gagal memuat data user')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [filter])

  const handleApprove = async (user) => {
    setConfirmModal({
      open: true,
      type: 'approval',
      user: user
    })
  }

  const handleDelete = async (user) => {
    setConfirmModal({
      open: true,
      type: 'deletion',
      user: user
    })
  }

  const handleReject = async (user) => {
    setConfirmModal({
      open: true,
      type: 'rejection',
      user: user
    })
  }

  const handleConfirmAction = async (reason = '') => {
    const { type, user } = confirmModal
    setActionLoading(true)

    try {
      let response
      let successMessage = ''

      switch (type) {
        case 'approval':
          response = await api.approveUser(user.id)
          successMessage = `${user.name} berhasil disetujui sebagai ${getRoleDisplayName(user.role)}. Welcome notification telah dikirim.`
          break
        
        case 'rejection':
          response = await api.rejectUser(user.id, reason)
          successMessage = `${user.name} telah ditolak. Alasan: ${reason}`
          break
        
        case 'deletion':
          response = await api.deleteUser(user.id)
          successMessage = `${user.name} berhasil dihapus dari sistem.`
          break
      }

      // Close confirmation modal
      setConfirmModal({ open: false, type: null, user: null })
      
      // Show success modal
      setSuccessModal({
        open: true,
        type: type,
        user: user,
        message: successMessage
      })

      // Reload users
      loadUsers()

      // Play success sound (optional)
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
          audio.volume = 0.3
          audio.play().catch(() => {}) // Ignore errors if audio fails
        } catch (e) {
          // Ignore audio errors
        }
      }

    } catch (err) {
      toast.error(err.message || `Gagal ${type === 'approval' ? 'menyetujui' : type === 'rejection' ? 'menolak' : 'menghapus'} user`)
      setConfirmModal({ open: false, type: null, user: null })
    } finally {
      setActionLoading(false)
    }
  }

  const canApprove = (user) => {
    if (isDirector(currentUser)) return true
    if (isSiteManager(currentUser) && user.role === 'engineer') return true
    return false
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'warning', icon: Clock, label: 'Menunggu' },
      approved: { variant: 'success', icon: CheckCircle, label: 'Disetujui' },
      rejected: { variant: 'danger', icon: XCircle, label: 'Ditolak' }
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} />
        {config.label}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      render: (value, user) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className="text-sm font-medium text-gray-700">
          {getRoleDisplayName(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'created_at',
      label: 'Tanggal Daftar',
      render: (value) => new Date(value).toLocaleDateString('id-ID')
    },
    {
      key: 'approver',
      label: 'Disetujui Oleh',
      render: (value, user) => (
        <div className="text-sm">
          {value ? (
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-xs text-gray-500">
                {user.approved_at ? new Date(user.approved_at).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>
          ) : '-'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_, user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedUser(user)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Lihat Detail"
          >
            <Eye size={16} />
          </button>
          
          {user.status === 'pending' && canApprove(user) && (
            <>
              <button
                onClick={() => handleApprove(user)}
                className="p-1 text-gray-400 hover:text-green-600 rounded"
                title="Setujui"
              >
                <UserCheck size={16} />
              </button>
              <button
                onClick={() => setRejectModal(user)}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Tolak"
              >
                <UserX size={16} />
              </button>
            </>
          )}
          
          {/* Delete button for rejected users or directors can delete any pending/rejected */}
          {((user.status === 'rejected') || (user.status === 'pending' && isDirector(currentUser))) && (
            <button
              onClick={() => handleDelete(user)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Hapus User"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  const filteredUsers = users.filter(user => {
    // Site manager hanya bisa lihat engineer
    if (isSiteManager(currentUser) && user.role !== 'engineer') {
      return false
    }
    return true
  })

  const pendingCount = filteredUsers.filter(u => u.status === 'pending').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Persetujuan User</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola registrasi user baru
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {pendingCount} menunggu
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'pending', label: 'Menunggu', count: filteredUsers.filter(u => u.status === 'pending').length },
          { key: 'approved', label: 'Disetujui', count: filteredUsers.filter(u => u.status === 'approved').length },
          { key: 'rejected', label: 'Ditolak', count: filteredUsers.filter(u => u.status === 'rejected').length },
          { key: 'all', label: 'Semua', count: filteredUsers.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <Loading text="Memuat data user..." />
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          emptyText="Tidak ada user ditemukan"
        />
      )}

      {/* User Detail Modal */}
      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Detail User"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Nama</label>
                <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-700">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Role</label>
                <p className="text-sm text-gray-700">{getRoleDisplayName(selectedUser.role)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Tanggal Daftar</label>
                <p className="text-sm text-gray-700">
                  {new Date(selectedUser.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {selectedUser.status !== 'pending' && (
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      {selectedUser.status === 'approved' ? 'Disetujui Oleh' : 'Ditolak Oleh'}
                    </label>
                    <p className="text-sm text-gray-700">{selectedUser.approver || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Tanggal</label>
                    <p className="text-sm text-gray-700">
                      {selectedUser.approved_at 
                        ? new Date(selectedUser.approved_at).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                
                {selectedUser.rejection_reason && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-500">Alasan Penolakan</label>
                    <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg mt-1">
                      {selectedUser.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedUser.status === 'pending' && canApprove(selectedUser) && (
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => {
                    handleApprove(selectedUser)
                    setSelectedUser(null)
                  }}
                  variant="success"
                  leftIcon={<UserCheck size={16} />}
                  className="flex-1"
                >
                  Setujui
                </Button>
                <Button
                  onClick={() => {
                    setRejectModal(selectedUser)
                    setSelectedUser(null)
                  }}
                  variant="danger"
                  leftIcon={<UserX size={16} />}
                  className="flex-1"
                >
                  Tolak
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => {
          setRejectModal(null)
          setRejectReason('')
        }}
        title="Tolak Registrasi"
        size="sm"
      >
        {rejectModal && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                Anda akan menolak registrasi <strong>{rejectModal.name}</strong> sebagai{' '}
                <strong>{getRoleDisplayName(rejectModal.role)}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectModal(null)
                  setRejectReason('')
                }}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                leftIcon={<UserX size={16} />}
              >
                Tolak User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Confirmation Modal */}
      <ConfirmationModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, type: null, user: null })}
        onConfirm={handleConfirmAction}
        type={confirmModal.type}
        user={confirmModal.user}
        requireReason={confirmModal.type === 'rejection'}
        loading={actionLoading}
      />

      {/* New Success Modal */}
      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, type: null, user: null, message: '' })}
        type={successModal.type}
        user={successModal.user}
        message={successModal.message}
        autoClose={true}
        autoCloseDelay={4000}
      />
    </div>
  )
}