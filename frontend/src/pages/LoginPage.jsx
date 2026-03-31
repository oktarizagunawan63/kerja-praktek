import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import amsarLogo from '../../assets/amsar.png'

// Mock users — Budi satu-satunya direktur
const MOCK_USERS = [
  { email: 'budi@amsar.co.id',   password: 'budi123',   name: 'Budi Santoso',  role: 'direktur' },
  { email: 'siti@amsar.co.id',   password: 'siti123',   name: 'Siti Rahayu',   role: '' },
  { email: 'ahmad@amsar.co.id',  password: 'ahmad123',  name: 'Ahmad Fauzi',   role: '' },
  { email: 'dewi@amsar.co.id',   password: 'dewi123',   name: 'Dewi Lestari',  role: '' },
  { email: 'rudi@amsar.co.id',   password: 'rudi123',   name: 'Rudi Hartono',  role: '' },
]

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Coba mock login dulu
      const mockUser = MOCK_USERS.find(
        u => u.email === form.email && u.password === form.password
      )
      if (mockUser) {
        setAuth('mock-token-' + Date.now(), { name: mockUser.name, role: mockUser.role, email: mockUser.email })
        navigate('/dashboard')
        return
      }
      // Fallback ke API kalau ada backend
      const { default: api } = await import('../lib/api')
      const { data } = await api.post('/auth/login', form)
      setAuth(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Email atau password salah'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f4c81] to-[#1a6bb5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 flex items-center justify-center bg-white shadow">
            <img src={amsarLogo} alt="PT Amsar" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">PT Amsar</h1>
          <p className="text-sm text-gray-500">Medical Services Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
              placeholder="nama@amsar.co.id" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
