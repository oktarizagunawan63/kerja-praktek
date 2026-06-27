import { useState } from 'react'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import { Save, Lock } from '@icons'
import { getRoleDisplayName } from '../utils/roleUtils'
import toast from 'react-hot-toast'

const EMPTY_PW = { current_password: '', new_password: '', new_password_confirmation: '' }

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [name, setName] = useState(user?.name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwForm, setPwForm] = useState(EMPTY_PW)
  const [savingPw, setSavingPw] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingProfile(true)
    try {
      const res = await api.updateProfile({ name: name.trim() })
      updateUser(res.user)
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error(err?.message || 'Gagal memperbarui profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setSavingPw(true)
    try {
      const res = await api.changePassword(pwForm)
      toast.success(res?.message || 'Password berhasil diubah')
      setPwForm(EMPTY_PW)
    } catch (err) {
      toast.error(err?.message || 'Gagal mengubah password')
    } finally {
      setSavingPw(false)
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U'
  const nameChanged = name.trim() !== (user?.name ?? '')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>

      {/* Account info + name edit */}
      <div className="card p-6">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#237043]/10 text-2xl font-bold text-[#237043]">
            {initial}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.role && (
              <span className="mt-1 inline-block rounded-full bg-[#237043]/10 px-2.5 py-0.5 text-xs font-medium text-[#237043]">
                {getRoleDisplayName(user.role)}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Informasi Akun</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {user?.division && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Divisi</label>
              <input
                value={user.division}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProfile || !nameChanged}
              className="inline-flex items-center gap-2 rounded-lg bg-[#237043] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5a35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Ubah Password</h3>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password Saat Ini <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 karakter"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pwForm.new_password_confirmation}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password_confirmation: e.target.value }))}
                required
                autoComplete="new-password"
                placeholder="Ulangi password baru"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#237043] focus:outline-none focus:ring-1 focus:ring-[#237043]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex items-center gap-2 rounded-lg bg-[#237043] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5a35] transition-colors disabled:opacity-50"
            >
              <Lock size={14} />
              {savingPw ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
