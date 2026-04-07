import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, ChevronDown, Users, Briefcase, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { api } from '../lib/api'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null) // null = normal login
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const roles = [
    { 
      value: 'site_manager', 
      label: 'Site Manager', 
      icon: Briefcase,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Full access to visit management'
    },
    { 
      value: 'sales', 
      label: 'Sales', 
      icon: Users,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Create visits and attendance'
    }
  ]

  const currentRole = selectedRole ? roles.find(r => r.value === selectedRole) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Send role only if selected (for Site Manager/Sales)
      const loginData = selectedRole 
        ? { ...form, role: selectedRole }
        : { ...form }
      
      const res = await api.login(loginData)
      
      // Role validation only if role was selected
      if (selectedRole) {
        const userRole = res.user.role.toLowerCase();
        const selectedRoleLower = selectedRole.toLowerCase();
        
        if (userRole !== selectedRoleLower) {
          toast.error(`Akun Anda tidak memiliki akses sebagai ${currentRole.label}`)
          setLoading(false)
          return
        }
      }
      
      setAuth(res.token, res.user)
      
      // Role-based redirect
      const redirectRole = res.user.role.toLowerCase();
      if (redirectRole === 'site_manager') {
        navigate('/manager/dashboard')
      } else if (redirectRole === 'sales') {
        navigate('/sales/dashboard')
      } else {
        // Direktur and others go to normal dashboard
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f4c81] to-[#1a6bb5] flex items-center justify-center p-4 relative">
      {/* Role Selector - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="relative">
          {!selectedRole ? (
            // Normal Login Button
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20"
            >
              <Users size={16} />
              <span>Login as Staff</span>
              <ChevronDown size={14} />
            </button>
          ) : (
            // Selected Role Button
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedRole(null)
                  setShowRoleDropdown(false)
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${currentRole.color}`}
              >
                <currentRole.icon size={16} />
                <span>Login as {currentRole.label}</span>
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {showRoleDropdown && (
            <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Login Type</p>
              </div>
              
              {/* Normal Login Option */}
              <button
                onClick={() => {
                  setSelectedRole(null)
                  setShowRoleDropdown(false)
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  !selectedRole ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-600">
                  <Crown size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Normal Login</p>
                  <p className="text-xs text-gray-500">For Direktur and regular users</p>
                </div>
                {!selectedRole && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
              
              {/* Staff Role Options */}
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    setSelectedRole(role.value)
                    setShowRoleDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    selectedRole === role.value ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${role.color.split(' ')[0]}`}>
                    <role.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                  {selectedRole === role.value && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#0f4c81] rounded-2xl flex items-center justify-center mb-3">
            <Stethoscope className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">PT Amsar</h1>
          <p className="text-sm text-gray-500">Medical Services Dashboard</p>
        </div>

        {/* Selected Login Type Indicator */}
        {selectedRole ? (
          <div className={`mb-6 p-3 rounded-lg ${currentRole.color.split(' ')[0].replace('bg-', 'bg-').replace('-600', '-50')} border border-${currentRole.color.split(' ')[0].replace('bg-', '').replace('-600', '-200')}`}>
            <div className="flex items-center gap-2">
              <currentRole.icon size={16} className={currentRole.color.split(' ')[0].replace('bg-', 'text-').replace('-600', '-600')} />
              <span className={`text-sm font-medium ${currentRole.color.split(' ')[0].replace('bg-', 'text-').replace('-600', '-700')}`}>
                Logging in as {currentRole.label}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Normal Login (Direktur/Regular Users)
              </span>
            </div>
          </div>
        )}

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
            className={`w-full text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
              selectedRole ? currentRole.color : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {loading ? 'Masuk...' : selectedRole ? `Masuk sebagai ${currentRole.label}` : 'Masuk'}
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
