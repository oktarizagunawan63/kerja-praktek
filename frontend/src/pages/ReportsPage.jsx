import TimelineChart from '../components/charts/TimelineChart'
import BudgetChart from '../components/charts/BudgetChart'
import ManpowerChart from '../components/charts/ManpowerChart'

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Laporan & Analitik</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimelineChart />
        <BudgetChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ManpowerChart />
        <div className="card flex items-center justify-center text-gray-400 text-sm min-h-[280px]">
          Export laporan PDF / Excel (coming soon)
        </div>
      </div>
    </div>
  )
}
