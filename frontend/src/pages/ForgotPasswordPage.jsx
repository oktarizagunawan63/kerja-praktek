import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendToken = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Email harus diisi')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Format email tidak valid')
      return
    }

    setLoading(true)
    try {
      const response = await api.sendResetToken(email.trim())
      
      if (response.success) {
        toast.success('Kode verifikasi telah dikirim ke email Anda!')
        setEmailSent(true)
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)
        }, 5000)
      } else {
        toast.error(response.message || 'Gagal mengirim kode verifikasi')
      }
    } catch (err) {
      console.error('Send token error:', err)
      toast.error(err.message || 'Gagal mengirim kode verifikasi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Kode Dikirim!</h2>
                <p className="text-gray-600">
                  Kode verifikasi telah dikirim ke:
                </p>
                <p className="font-semibold text-blue-600 mt-2">{email}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Langkah selanjutnya:</strong><br />
                  1. Buka email Anda (cek juga folder spam)<br />
                  2. Salin kode verifikasi 6 digit<br />
                  3. Klik tombol di bawah untuk melanjutkan
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleContinue} className="w-full">
                  Lanjutkan ke Input Kode
                </Button>
                
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              © 2026 PT Amsar Prima Mandiri
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Kembali ke Login</span>
          </Link>

          {/* Content */}
          <form onSubmit={handleSendToken} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password?</h2>
              <p className="text-gray-600">
                Masukkan email Anda dan kami akan mengirimkan kode verifikasi untuk reset password
              </p>
            </div>

            <div>
              <Input
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-center"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Pastikan email yang Anda masukkan benar dan aktif
              </p>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!email.trim() || loading}
              className="w-full"
            >
              {loading ? 'Mengirim Kode...' : 'Kirim Kode Verifikasi'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            © 2026 PT Amsar Prima Mandiri
          </p>
        </div>
      </div>
    </div>
  )
}