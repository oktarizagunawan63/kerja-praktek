import clsx from 'clsx'

export default function ProgressBar({
  label,
  value,
  target,
  progress,
  color = 'bg-blue-500',
  showPercent = true
}) {
  const hasProgressOnly = typeof progress === 'number' && value === undefined && target === undefined
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
  const safeTarget = Number.isFinite(Number(target)) && Number(target) > 0 ? Number(target) : 100
  const safeProgress = Number.isFinite(Number(progress)) ? Number(progress) : 0
  const pct = hasProgressOnly
    ? Math.max(0, Math.min(Math.round(safeProgress), 100))
    : Math.max(0, Math.min(Math.round((safeValue / safeTarget) * 100), 100))
  const isOver = !hasProgressOnly && safeValue > safeTarget

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-600">
        <span className="font-medium">{label || 'Progress'}</span>
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
      {!hasProgressOnly && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>Realisasi: {safeValue.toLocaleString('id-ID')}</span>
          <span>Target: {safeTarget.toLocaleString('id-ID')}</span>
        </div>
      )}
    </div>
  )
}
