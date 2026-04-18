import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} rounded-full border-2 border-primary-200 border-t-primary-600`}
      />
    </div>
  )
}

export default LoadingSpinner
