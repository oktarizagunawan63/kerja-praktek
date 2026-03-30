import clsx from 'clsx'

const variants = {
  success:  'bg-green-100 text-green-700',
  warning:  'bg-yellow-100 text-yellow-700',
  danger:   'bg-red-100 text-red-600',
  info:     'bg-blue-100 text-blue-700',
  default:  'bg-gray-100 text-gray-600',
}

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}
