import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.login(form)
      setAuth(res.token, res.user)
      
      // Role-based redirect
      const redirectRole = res.user.role.toLowerCase();
      if (redirectRole === 'sales_manager') {
        navigate('/manager/dashboard')
      } else if (redirectRole === 'sales') {
        navigate('/sales/dashboard')
      } else {
        // Administrator and others go to normal dashboard
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Email atau password salah')
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-[#0f4c81] hover:underline">
            Lupa password?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[#0f4c81] hover:underline font-medium">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
