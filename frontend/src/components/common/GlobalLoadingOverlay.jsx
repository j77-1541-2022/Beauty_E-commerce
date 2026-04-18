import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import { useErrorHandler } from '../../contexts/ErrorHandlerContext'

const GlobalLoadingOverlay = () => {
  const { hasAnyLoading } = useErrorHandler()
  const visible = hasAnyLoading()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white text-gray-900 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3"
          >
            <Loader className="w-5 h-5 animate-spin text-pink-600" />
            <p className="text-sm font-medium">Please wait...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalLoadingOverlay
