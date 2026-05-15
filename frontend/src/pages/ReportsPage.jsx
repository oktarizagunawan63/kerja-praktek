import { useEffect, useState } from 'react'
import { FileDown, Loader2 } from '../lib/icons.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import useAppStore from '../store/appStore'
import { formatRupiah } from '../lib/formatRupiah'
import toast from 'react-hot-toast'

const statusLabel = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  delayed: 'Delayed',
  completed: 'Selesai',
}

const statusClass = {
  on_track: 'bg-green-100 text-green-700',
  at_risk: 'bg-yellow-100 text-yellow-700',
  delayed: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
}

const chartName = (name = '') => name.length > 12 ? `${name.slice(0, 12)}...` : name

export default function ReportsPage() {
  const projects = useAppStore(state => state.projects)
  const projectsLoading = useAppStore(state => state.projectsLoading)
  const projectsError = useAppStore(state => state.projectsError)
  const fetchProjects = useAppStore(state => state.fetchProjects)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const reportProjects = projects || []
  const active = reportProjects.filter(p => p.status !== 'completed')
  const completed = reportProjects.filter(p => p.status === 'completed')

  const handleExportPDF = async () => {
    if (reportProjects.length === 0) {
      toast.error('Belum ada data proyek')
      return
    }

    setLoading(true)
    try {
      const { exportLaporanPDF } = await import('../lib/exportPdf')
      exportLaporanPDF(reportProjects)
      toast.success('PDF berhasil diunduh')
    } catch (err) {
      console.error(err)
      toast.error('Gagal generate PDF')
    } finally {
      setLoading(false)
    }
  }

  const budgetData = reportProjects.map(p => ({
    name: chartName(p.name),
    RAB: p.rab || 0,
    Realisasi: p.realisasi || 0,
  }))

  const progressData = reportProjects.map(p => ({
    name: chartName(p.name),
    Progress: p.status === 'completed' ? 100 : (p.progress || 0),
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Laporan & Analitik</h1>
        <button onClick={handleExportPDF} disabled={loading}
          className="flex items-center gap-2 bg-[#237043] hover:bg-[#5a9844] disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg font-medium">
          {loading ? <><Loader2 size={15} className="animate-spin"/> Generating...</> : <><FileDown size={15}/> Export PDF</>}
        </button>
      </div>

      {projectsLoading && reportProjects.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-sm">Memuat data laporan...</p>
        </div>
      ) : projectsError ? (
        <div className="card text-center py-16 text-red-500">
          <p className="text-sm">Gagal memuat laporan: {projectsError}</p>
        </div>
      ) : reportProjects.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-sm">Belum ada proyek untuk ditampilkan</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-xs text-gray-500">Total Proyek</p>
              <p className="text-2xl font-bold text-gray-900">{reportProjects.length}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Proyek Aktif</p>
              <p className="text-2xl font-bold text-[#237043]">{active.length}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Proyek Selesai</p>
              <p className="text-2xl font-bold text-blue-700">{completed.length}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress per Proyek (%)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={progressData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#b7cdc0"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 12 }} unit="%"/>
                <Tooltip formatter={v => `${v}%`}/>
                <Bar dataKey="Progress" fill="#237043" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">RAB vs Realisasi per Proyek</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#b7cdc0"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatRupiah(v).replace('Rp ', '')}/>
                <Tooltip formatter={v => formatRupiah(v)}/>
                <Legend/>
                <Bar dataKey="RAB" fill="#b7cdc0" name="RAB" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="Realisasi" fill="#237043" name="Realisasi" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

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
                  {reportProjects.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.location}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.pm}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel[p.status] || p.status || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{p.status === 'completed' ? 100 : (p.progress || 0)}%</td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs">{formatRupiah(p.rab)}</td>
                      <td className={`px-3 py-2.5 text-xs font-medium ${p.realisasi > p.rab ? 'text-red-500' : 'text-gray-700'}`}>
                        {formatRupiah(p.realisasi || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID') : '-'}</td>
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
