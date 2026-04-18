import React from 'react'
import { motion } from 'framer-motion'

const SkeletonCard = ({ height = 'h-48', className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden ${className}`}
    style={{ height }}
  >
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg animate-pulse" />
          <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-3/4 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg animate-pulse" />
        <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-5/6 animate-pulse" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-20 animate-pulse" />
        <div className="h-10 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-32 animate-pulse" />
      </div>
    </div>
  </motion.div>
)

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <SkeletonCard className={className} />
      case 'list':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 p-4 space-y-3 ${className}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-3/4 animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-1/2 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )
      case 'stats':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20 p-6 ${className}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl animate-pulse" />
              <div className="w-8 h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-20 animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-32 mt-2 animate-pulse" />
          </motion.div>
        )
      default:
        return <SkeletonCard className={className} />
    }
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

export default SkeletonLoader
