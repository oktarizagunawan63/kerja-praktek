import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

/**
 * Reusable input component with validation support
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasError = !!error

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            hasError 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-200 hover:border-gray-300',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        
        {hasError && (
          <AlertCircle 
            size={16} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" 
          />
        )}
      </div>
      
      {error && (
        <p 
          id={`${props.id}-error`}
          className="text-xs text-red-500 mt-1 flex items-center gap-1"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

// Specialized input components
export const CurrencyInput = forwardRef(({ value, onChange, ...props }, ref) => {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    const formatted = raw ? parseInt(raw).toLocaleString('id-ID') : ''
    onChange?.(formatted)
  }

  return (
    <Input
      ref={ref}
      value={value}
      onChange={handleChange}
      placeholder="0"
      {...props}
    />
  )
})

CurrencyInput.displayName = 'CurrencyInput'