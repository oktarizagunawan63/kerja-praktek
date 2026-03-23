import clsx from 'clsx'

export default function ProgressBar({ label, value, target, color = 'bg-blue-500', showPercent = true }) {
  const pct = Math.min(Math.round((value / target) * 100), 100)
  const isOver = value > target

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-600">
        <span className="font-medium">{label}</span>
        {showPercent && (
          <span className={clsx('font-semibold', isOver ? 'text-red-500' : 'text-gray-700')}>
            {pct}%
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', isOver ? 'bg-red-400' : color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Realisasi: {value.toLocaleString('id-ID')}</span>
        <span>Target: {target.toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}
