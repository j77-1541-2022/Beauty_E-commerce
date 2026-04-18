import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'

const FormValidator = ({
  value,
  rules = {},
  onValidationChange,
  showErrors = true,
  debounceMs = 300
}) => {
  const [errors, setErrors] = useState([])
  const [isValid, setIsValid] = useState(null)
  const [isTouched, setIsTouched] = useState(false)
  const [debouncedValue, setDebouncedValue] = useState(value)

  // Debounce value changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, debounceMs])

  // Validate the value against rules
  const validate = useCallback((val) => {
    const newErrors = []
    
    Object.entries(rules).forEach(([ruleName, ruleConfig]) => {
      if (typeof ruleConfig === 'function') {
        const result = ruleConfig(val)
        if (result !== true) {
          newErrors.push(result || `${ruleName} validation failed`)
        }
      } else if (typeof ruleConfig === 'object' && ruleConfig.validate) {
        const result = ruleConfig.validate(val)
        if (result !== true) {
          newErrors.push(ruleConfig.message || result || `${ruleName} validation failed`)
        }
      }
    })

    setErrors(newErrors)
    setIsValid(newErrors.length === 0)
    
    if (onValidationChange) {
      onValidationChange(newErrors.length === 0, newErrors)
    }
    
    return newErrors.length === 0
  }, [rules, onValidationChange])

  // Validate when debounced value changes and field has been touched
  useEffect(() => {
    if (isTouched) {
      validate(debouncedValue)
    }
  }, [debouncedValue, validate, isTouched])

  const handleBlur = () => {
    setIsTouched(true)
    validate(value)
  }

  const handleFocus = () => {
    setIsTouched(false)
  }

  return {
    validate,
    errors,
    isValid,
    isTouched,
    handleBlur,
    handleFocus,
    setIsTouched,
    ValidationUI: () => (
      <AnimatePresence>
        {showErrors && isTouched && errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-1 space-y-1"
          >
            {errors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
        {showErrors && isTouched && isValid && value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-1 flex items-center gap-2 text-sm text-emerald-600"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Valid</span>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    StatusIcon: () => (
      <AnimatePresence>
        {isTouched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {errors.length > 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
              </motion.div>
            ) : isValid && value ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-5 h-5 text-emerald-500" />
              </motion.div>
            ) : null}
          </div>
        )}
      </AnimatePresence>
    )
  }
}

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required'
    }
    return true
  },
  
  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Minimum ${min} characters required`
    }
    return true
  },
  
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Maximum ${max} characters allowed`
    }
    return true
  },
  
  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address'
    }
    return true
  },
  
  phone: (value) => {
    if (value && !/^\+?[\d\s-()]+$/.test(value)) {
      return 'Please enter a valid phone number'
    }
    return true
  },
  
  numeric: (value) => {
    if (value && isNaN(Number(value))) {
      return 'Please enter a valid number'
    }
    return true
  },
  
  min: (min) => (value) => {
    if (value !== '' && Number(value) < min) {
      return `Minimum value is ${min}`
    }
    return true
  },
  
  max: (max) => (value) => {
    if (value !== '' && Number(value) > max) {
      return `Maximum value is ${max}`
    }
    return true
  },
  
  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message || 'Invalid format'
    }
    return true
  },
  
  match: (otherValue, fieldName) => (value) => {
    if (value !== otherValue) {
      return `Must match ${fieldName}`
    }
    return true
  },
  
  url: (value) => {
    if (value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value)) {
      return 'Please enter a valid URL'
    }
    return true
  },
  
  sku: (value) => {
    if (value && !/^[A-Z0-9-]+$/i.test(value)) {
      return 'SKU can only contain letters, numbers, and hyphens'
    }
    return true
  },
  
  price: (value) => {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
      return 'Please enter a valid price'
    }
    return true
  }
}

export default FormValidator
