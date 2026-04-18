import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { useErrorHandler } from '../contexts/ErrorHandlerContext'
import { useTheme } from '../contexts/ThemeContext'

const ErrorToast = () => {
  const { error, clearError } = useErrorHandler()
  const { colors, theme } = useTheme()
  const isDark = theme === 'dark'

  if (!error) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: '50%' }}
        animate={{ opacity: 1, y: 0, x: '50%' }}
        exit={{ opacity: 0, y: 50, x: '50%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-md"
      >
        <div className={`mx-4 p-4 rounded-xl shadow-2xl border ${
          error.status >= 500 
            ? 'bg-red-500 border-red-600 text-white' 
            : error.status >= 400
            ? 'bg-amber-500 border-amber-600 text-white'
            : 'bg-red-500 border-red-600 text-white'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold mb-1">
                {error.status >= 500 ? 'Server Error' : error.status >= 400 ? 'Request Error' : 'Error'}
              </p>
              <p className="text-sm opacity-90 mb-1">{error.message}</p>
              {error.context && (
                <p className="text-xs opacity-75">Context: {error.context}</p>
              )}
            </div>
            <button
              onClick={clearError}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ErrorToast
