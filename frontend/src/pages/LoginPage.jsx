import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const { loginCheck } = useUserStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Cek di userStore dulu (local users)
      const localUser = loginCheck(form.email, form.password)
      if (localUser) {
        setAuth('local-token-' + localUser.id, localUser)
        navigate('/dashboard')
        return
      }
      toast.error('Email atau password salah')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f4c81] to-[#1a6bb5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#0f4c81] rounded-2xl flex items-center justify-center mb-3">
            <Stethoscope className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">PT Amsar</h1>
          <p className="text-sm text-gray-500">Medical Services Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
              placeholder="nama@ptamsar.co.id" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#0f4c81] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1a6bb5] transition-colors disabled:opacity-60">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
