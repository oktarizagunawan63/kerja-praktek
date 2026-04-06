import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Key, Clock, AlertCircle, CheckCircle, Eye, EyeOff, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const STEPS = {
  TOKEN: 'token',
  PASSWORD: 'password',
  SUCCESS: 'success'
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''
  
  const [step, setStep] = useState(STEPS.TOKEN)
  const [email, setEmail] = useState(emailFromUrl)
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes in seconds

  // Countdown timer for token expiry
  useEffect(() => {
    if (step === STEPS.TOKEN && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, timeLeft])

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password')
    }
  }, [email, navigate])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validatePassword = () => {
    if (!password || password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return false
    }
    if (password !== passwordConfirmation) {
      toast.error('Konfirmasi password tidak sama')
      return false
    }
    return true
  }

  const handleVerifyToken = async (e) => {
    e.preventDefault()
    
    if (!token || token.length !== 6) {
      toast.error('Kode harus 6 digit')
      return
    }

    if (timeLeft <= 0) {
      toast.error('Kode sudah kedaluwarsa. Silakan minta kode baru.')
      return
    }

    setLoading(true)
    try {
      const response = await api.verifyResetToken(email, token)
      
      if (response.success) {
        toast.success('Kode valid! Silakan buat password baru.')
        setStep(STEPS.PASSWORD)
      } else {
        toast.error(response.message || 'Kode salah atau expired')
      }
    } catch (err) {
      console.error('Verify token error:', err)
      toast.error(err.message || 'Kode salah atau expired')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!validatePassword()) {
      return
    }

    setLoading(true)
    try {
      const response = await api.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      })
      
      if (response.success) {
        toast.success('Password berhasil direset!')
        setStep(STEPS.SUCCESS)
        
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error(response.message || 'Gagal reset password')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      toast.error(err.message || 'Gagal reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleResendToken = async () => {
    setLoading(true)
    try {
      const response = await api.sendResetToken(email)
      
      if (response.success) {
        toast.success('Kode baru telah dikirim ke email Anda')
        setTimeLeft(10 * 60) // Reset timer to 10 minutes
        setToken('') // Clear current token
      } else {
        toast.error(response.message || 'Gagal mengirim kode')
      }
    } catch (err) {
      console.error('Resend token error:', err)
      toast.error(err.message || 'Gagal mengirim kode')
    } finally {
      setLoading(false)
    }
  }

  const renderTokenStep = () => (
    <form onSubmit={handleVerifyToken} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key size={32} className="text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Masukkan Kode Verifikasi</h2>
        <p className="text-gray-600 mb-4">
          Kode verifikasi 6 digit telah dikirim ke:
        </p>
        <p className="font-semibold text-blue-600">{email}</p>
        
        {/* Timer */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mt-4 ${
          timeLeft > 300 ? 'bg-green-100 text-green-700' : 
          timeLeft > 60 ? 'bg-yellow-100 text-yellow-700' : 
          'bg-red-100 text-red-700'
        }`}>
          <Clock size={16} />
          <span>Kode berlaku {formatTime(timeLeft)} lagi</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kode Verifikasi
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
          maxLength={6}
          required
          autoFocus
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-2 text-center">
          Masukkan 6 digit kode dari email Anda
        </p>
      </div>

      {timeLeft <= 0 ? (
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle size={16} />
              <span className="font-medium">Kode Kedaluwarsa</span>
            </div>
            <p className="text-sm text-red-600">
              Kode sudah tidak berlaku. Silakan minta kode baru.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleResendToken}
            loading={loading}
            variant="secondary"
            className="w-full"
          >
            Kirim Kode Baru
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            type="submit"
            loading={loading}
            disabled={token.length !== 6 || loading}
            className="w-full"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
          </Button>
          
          <button
            type="button"
            onClick={handleResendToken}
            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            Tidak menerima kode? Kirim ulang
          </button>
        </div>
      )}

      {/* Email reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <Mail size={16} />
          <span className="font-medium">Cek Email Anda</span>
        </div>
        <p className="text-sm text-blue-600">
          Kode dikirim ke email Anda. Jika tidak ada di inbox, cek folder spam/junk.
        </p>
      </div>
    </form>
  )

  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key size={32} className="text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Baru</h2>
        <p className="text-gray-600">
          Buat password baru yang kuat untuk akun Anda
        </p>
      </div>

      <div>
        <Input
          label="Password Baru"
          type={showPassword ? 'text' : 'password'}
          placeholder="Masukkan password baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
      </div>

      <div>
        <Input
          label="Konfirmasi Password"
          type={showPasswordConfirmation ? 'text' : 'password'}
          placeholder="Ulangi password baru"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
          disabled={loading}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPasswordConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        {password && passwordConfirmation && (
          <p className={`text-xs mt-1 ${
            password === passwordConfirmation ? 'text-green-600' : 'text-red-600'
          }`}>
            {password === passwordConfirmation ? '✓ Password cocok' : '✗ Password tidak cocok'}
          </p>
        )}
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={!password || !passwordConfirmation || password !== passwordConfirmation || loading}
        className="w-full"
      >
        {loading ? 'Mereset Password...' : 'Reset Password'}
      </Button>
    </form>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Direset!</h2>
        <p className="text-gray-600">
          Password Anda telah berhasil diubah. Anda akan diarahkan ke halaman login.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">
          <strong>Keamanan Akun:</strong><br />
          • Semua sesi login sebelumnya telah dihapus<br />
          • Gunakan password baru untuk login<br />
          • Jaga kerahasiaan password Anda
        </p>
      </div>

      <Button
        onClick={() => navigate('/login')}
        className="w-full"
      >
        Login Sekarang
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          {step !== STEPS.SUCCESS && (
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Kembali</span>
            </Link>
          )}

          {/* Progress Indicator */}
          {step !== STEPS.SUCCESS && (
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                {[STEPS.TOKEN, STEPS.PASSWORD].map((stepName, index) => (
                  <div key={stepName} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === stepName ? 'bg-blue-600 text-white' :
                      [STEPS.TOKEN, STEPS.PASSWORD].indexOf(step) > index ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {[STEPS.TOKEN, STEPS.PASSWORD].indexOf(step) > index ? '✓' : index + 1}
                    </div>
                    {index < 1 && (
                      <div className={`w-8 h-0.5 ${
                        [STEPS.TOKEN, STEPS.PASSWORD].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step Content */}
          {step === STEPS.TOKEN && renderTokenStep()}
          {step === STEPS.PASSWORD && renderPasswordStep()}
          {step === STEPS.SUCCESS && renderSuccessStep()}
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