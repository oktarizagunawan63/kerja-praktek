import { useState, useCallback } from 'react'

/**
 * Custom hook for form validation
 */
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName]
    if (!rules) return null

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    return null
  }, [validationRules, values])

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validate, validationRules, values])

  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    if (touched[fieldName]) {
      const error = validate(fieldName, value)
      setErrors(prev => ({ ...prev, [fieldName]: error }))
    }
  }, [validate, touched])

  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    const error = validate(fieldName, values[fieldName])
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [validate, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues
  }
}

// Common validation rules
export const validationRules = {
  required: (value) => !value?.toString().trim() ? 'Field ini wajib diisi' : null,
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return value && !emailRegex.test(value) ? 'Format email tidak valid' : null
  },
  minLength: (min) => (value) => 
    value && value.length < min ? `Minimal ${min} karakter` : null,
  maxLength: (max) => (value) => 
    value && value.length > max ? `Maksimal ${max} karakter` : null,
  numeric: (value) => {
    const num = parseFloat(value?.toString().replace(/\./g, ''))
    return value && isNaN(num) ? 'Harus berupa angka' : null
  },
  positiveNumber: (value) => {
    const num = parseFloat(value?.toString().replace(/\./g, ''))
    return value && (isNaN(num) || num <= 0) ? 'Harus berupa angka positif' : null
  }
}