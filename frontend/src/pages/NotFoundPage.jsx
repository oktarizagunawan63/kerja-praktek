import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '../lib/icons.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-[96px] font-bold leading-none text-[#237043]">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-slate-500">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#237043] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a5a35]"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>
    </div>
  )
}
