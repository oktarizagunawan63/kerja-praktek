import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { useFormValidation, validationRules } from '../hooks/useFormValidation'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const initialValues = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'engineer'
}

const validation = {
  name: [validationRules.required, validationRules.minLength(2)],
  email: [validationRules.required, validationRules.email],
  password: [validationRules.required, validationRules.minLength(6)],
  password_confirmation: [
    validationRules.required,
    (value, values) => value !== values.password ? 'Password tidak sama' : null
  ],
  role: [validationRules.required],
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll
  } = useFormValidation(initialValues, validation)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateAll()) {
      toast.error('Mohon perbaiki error pada form')
      return
    }

    setLoading(true)
    try {
      const response = await api.register(values)
      setSuccess(true)
      toast.success('Registrasi berhasil! Menunggu persetujuan.')
    } catch (err) {
      toast.error(err.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f4c81] to-[#1a6bb5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Registrasi Berhasil!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Akun Anda telah terdaftar dan menunggu persetujuan dari direktur atau site manager. 
            Anda akan mendapat notifikasi melalui email setelah akun disetujui.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center bg-[#0f4c81] text-white py-2.5 px-4 rounded-lg hover:bg-[#1a6bb5] transition-colors"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f4c81] to-[#1a6bb5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#0f4c81] rounded-2xl flex items-center justify-center mb-3">
            <UserPlus className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Akun Baru</h1>
          <p className="text-sm text-gray-500">PT Amsar Prima Mandiri</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            type="text"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={touched.name ? errors.name : ''}
            placeholder="Masukkan nama lengkap"
            required
          />

          <Input
            label="Email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched.email ? errors.email : ''}
            placeholder="nama@ptamsar.co.id"
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={values.role}
              onChange={(e) => handleChange('role', e.target.value)}
              onBlur={() => handleBlur('role')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
              required
            >
              <option value="site_manager">Site Manager</option>
              <option value="engineer">Engineer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {values.role === 'site_manager' 
                ? 'Persetujuan dari Direktur' 
                : 'Persetujuan dari Direktur atau Site Manager'
              }
            </p>
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              error={touched.password ? errors.password : ''}
              placeholder="Minimal 6 karakter"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Konfirmasi Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={values.password_confirmation}
              onChange={(e) => handleChange('password_confirmation', e.target.value)}
              onBlur={() => handleBlur('password_confirmation')}
              error={touched.password_confirmation ? errors.password_confirmation : ''}
              placeholder="Ulangi password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Mendaftar...' : 'Daftar Akun'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#0f4c81] hover:underline font-medium">
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}