import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import TimelineChart from '../components/charts/TimelineChart'
import BudgetChart from '../components/charts/BudgetChart'
import ManpowerChart from '../components/charts/ManpowerChart'
import { exportLaporanPDF } from '../lib/exportPdf'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)

  const handleExportPDF = async () => {
    setLoading(true)
    try {
      await exportLaporanPDF('report-charts')
      toast.success('PDF berhasil diunduh')
    } catch (err) {
      console.error(err)
      toast.error('Gagal generate PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Laporan & Analitik</h1>
        <button
          onClick={handleExportPDF}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0f4c81] hover:bg-[#1a6bb5] disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
            : <><FileDown size={15} /> Export PDF</>
          }
        </button>
      </div>

      <div id="report-charts" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TimelineChart />
          <BudgetChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ManpowerChart />
          <div className="card flex flex-col items-center justify-center gap-3 min-h-[280px] text-center">
            <FileDown size={36} className="text-gray-300" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Export Laporan PDF</p>
              <p className="text-xs text-gray-400 mt-1">Rekap semua proyek beserta status,<br />progress, dan realisasi anggaran</p>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="flex items-center gap-2 bg-[#0f4c81] hover:bg-[#1a6bb5] disabled:opacity-60 text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
                : <><FileDown size={13} /> Download PDF</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
