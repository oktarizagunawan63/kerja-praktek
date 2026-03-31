import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import useAppStore from '../store/appStore'
import { formatRupiah } from '../lib/formatRupiah'
import { exportLaporanPDF } from '../lib/exportPdf'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { projects } = useAppStore()
  const [loading, setLoading] = useState(false)

  const active = projects.filter(p => p.status !== 'completed')

  const handleExportPDF = async () => {
    if (projects.length === 0) { toast.error('Belum ada data proyek'); return }
    setLoading(true)
    try {
      exportLaporanPDF(projects)
      toast.success('PDF berhasil diunduh')
    } catch (err) {
      console.error(err)
      toast.error('Gagal generate PDF')
    } finally {
      setLoading(false)
    }
  }

  // Data untuk bar chart RAB vs Realisasi
  const budgetData = active.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    RAB: p.rab || 0,
    Realisasi: p.realisasi || 0,
  }))

  // Data untuk line chart progress
  const progressData = active.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    Progress: p.progress || 0,
  }))


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Laporan & Analitik</h1>
        <button onClick={handleExportPDF} disabled={loading}
          className="flex items-center gap-2 bg-[#0f4c81] hover:bg-[#1a6bb5] disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg font-medium">
          {loading ? <><Loader2 size={15} className="animate-spin"/> Generating...</> : <><FileDown size={15}/> Export PDF</>}
        </button>
      </div>

      {active.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-sm">Belum ada proyek aktif untuk ditampilkan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress per Proyek */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress per Proyek (%)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={progressData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 12 }} unit="%"/>
                <Tooltip formatter={v => `${v}%`}/>
                <Bar dataKey="Progress" fill="#3b82f6" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* RAB vs Realisasi */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">RAB vs Realisasi per Proyek</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatRupiah(v).replace('Rp ','')}/>
                <Tooltip formatter={v => formatRupiah(v)}/>
                <Legend/>
                <Bar dataKey="RAB" fill="#e2e8f0" name="RAB" radius={[4,4,0,0]}/>
                <Bar dataKey="Realisasi" fill="#3b82f6" name="Realisasi" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ringkasan Tabel */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ringkasan Proyek</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Nama Proyek','Lokasi','PM','Status','Progress','RAB','Realisasi','Deadline'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {active.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.location}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.pm}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status==='on_track'?'bg-green-100 text-green-700':
                          p.status==='at_risk'?'bg-yellow-100 text-yellow-700':
                          'bg-red-100 text-red-600'
                        }`}>
                          {p.status==='on_track'?'On Track':p.status==='at_risk'?'At Risk':'Delayed'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{p.progress || 0}%</td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs">{formatRupiah(p.rab)}</td>
                      <td className={`px-3 py-2.5 text-xs font-medium ${p.realisasi > p.rab ? 'text-red-500' : 'text-gray-700'}`}>{formatRupiah(p.realisasi || 0)}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{new Date(p.deadline).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
