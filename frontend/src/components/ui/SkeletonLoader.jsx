import React from 'react'
import { motion } from 'framer-motion'

const SkeletonLoader = ({ 
  variant = 'default', 
  count = 1, 
  className = '',
  height = 'h-4',
  width = 'w-full'
}) => {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '1000px 100%',
    animation: 'shimmer 2s infinite'
  }

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`p-5 rounded-2xl bg-gray-100 ${className}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="flex-1 ml-4">
                <div className={`h-4 bg-gray-200 rounded mb-2 ${width}`} />
                <div className={`h-3 bg-gray-200 rounded w-3/4`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className={`h-3 bg-gray-200 rounded ${width}`} />
              <div className={`h-3 bg-gray-200 rounded w-5/6`} />
            </div>
          </div>
        )

      case 'table':
        return (
          <div className={`space-y-3 ${className}`}>
            <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 rounded bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 rounded bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 rounded bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-6 bg-gray-200 rounded-full" />
            </div>
          </div>
        )

      case 'product':
        return (
          <div className={`p-5 rounded-2xl bg-gray-100 ${className}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="w-20 h-6 rounded-full bg-gray-200" />
            </div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          </div>
        )

      case 'dashboard':
        return (
          <div className={`space-y-6 ${className}`}>
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-6 bg-gray-200 rounded w-2/3" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Content sections skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-5 rounded-2xl bg-gray-100">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-gray-100">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className}`}>
            <div className="w-full h-64 bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-300" />
            </div>
          </div>
        )

      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className={`h-4 bg-gray-200 rounded ${width}`} />
            <div className={`h-4 bg-gray-200 rounded w-5/6`} />
            <div className={`h-4 bg-gray-200 rounded w-4/6`} />
          </div>
        )

      default:
        return (
          <div 
            className={`rounded bg-gray-200 ${height} ${width}`}
            style={shimmerStyle}
          />
        )
    }
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </>
  )
}

export default SkeletonLoader
