import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'
import amsarLogo from '../assets/icon.ico?url'

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

      const redirectRole = String(res.user.role || '').toLowerCase()
      if (redirectRole === 'sales_manager') {
        navigate('/manager/dashboard')
      } else if (redirectRole === 'sales') {
        navigate('/sales/dashboard')
      } else if (redirectRole === 'site_manager') {
        navigate('/site/dashboard')
      } else if (redirectRole === 'engineer') {
        navigate('/engineer/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#237043] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#b7cdc0] bg-[#f3faf1] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center">
          <img
            src={amsarLogo}
            alt="PT Amsar"
            className="mb-3"
            style={{ width: 60, height: 60, objectFit: 'contain' }}
          />
          <h1 className="text-xl font-bold text-[#237043]">PT Amsar</h1>
          <p className="text-sm text-[#de168c]">Medical Services Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#237043]">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-[#a4ca9a] bg-[#b7cdc0]/20 px-4 py-2.5 text-sm text-[#237043] placeholder:text-[#5a9844] focus:border-[#de168c] focus:outline-none focus:ring-2 focus:ring-[#de168c]/35"
              placeholder="nama@ptamsar.co.id"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#237043]">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-[#a4ca9a] bg-[#b7cdc0]/20 px-4 py-2.5 text-sm text-[#237043] placeholder:text-[#5a9844] focus:border-[#de168c] focus:outline-none focus:ring-2 focus:ring-[#de168c]/35"
              placeholder="Password Anda"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#237043] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a9844] disabled:opacity-60"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm font-medium text-[#de168c] hover:underline">
            Lupa password?
          </Link>
        </div>

        <div className="mt-6 text-center" />
      </div>
    </div>
  )
}
