import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * KpiCard - reusable KPI metric card
 * @param {string} title
 * @param {string|number} value
 * @param {string} subtitle
 * @param {React.ReactNode} icon
 * @param {string} iconBg  - tailwind bg class
 * @param {'up'|'down'|'neutral'} trend
 * @param {string} trendLabel
 */
export default function KpiCard({ title, value, subtitle, icon, iconBg = 'bg-blue-100', trend, trendLabel }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      {trendLabel && (
        <div className={clsx('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon size={13} />
          {trendLabel}
        </div>
      )}
    </div>
  )
}
