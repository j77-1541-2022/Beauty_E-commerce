import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react'

const InsightsPanel = ({ insights }) => {
  // Handle undefined or null data
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="chart-container"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory Insights</h3>
              <p className="text-sm text-gray-600">AI-powered recommendations</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No insights available</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return AlertTriangle
      case 'out_of_stock':
        return AlertCircle
      case 'fast_moving':
        return TrendingUp
      case 'slow_moving':
        return TrendingDown
      default:
        return Package
    }
  }

  const getInsightColor = (type, priority) => {
    const colors = {
      high: {
        low_stock: 'border-red-200 bg-red-50 text-red-800',
        out_of_stock: 'border-red-200 bg-red-50 text-red-800',
        fast_moving: 'border-orange-200 bg-orange-50 text-orange-800',
        slow_moving: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      },
      medium: {
        low_stock: 'border-orange-200 bg-orange-50 text-orange-800',
        out_of_stock: 'border-red-200 bg-red-50 text-red-800',
        fast_moving: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        slow_moving: 'border-blue-200 bg-blue-50 text-blue-800',
      },
      low: {
        low_stock: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        out_of_stock: 'border-orange-200 bg-orange-50 text-orange-800',
        fast_moving: 'border-blue-200 bg-blue-50 text-blue-800',
        slow_moving: 'border-gray-200 bg-gray-50 text-gray-800',
      }
    }
    return colors[priority]?.[type] || colors.low.low_stock
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-blue-100 text-blue-800',
    }
    return badges[priority] || badges.low
  }

  if (!insights || insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Insights</h3>
        <p className="text-gray-600">No insights available at the moment.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Insights</h3>
        <span className="text-sm text-gray-600">{insights.length} recommendations</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.insight_type)
          const colorClass = getInsightColor(insight.insight_type, insight.priority)

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 ${colorClass}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium truncate">{insight.product.name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(insight.priority)}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">{insight.message}</p>
                  {insight.recommended_order && (
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <span>Current: {insight.product.current_stock}</span>
                      <span>Recommended: +{insight.recommended_order}</span>
                      {insight.days_until_stockout && (
                        <span>Days left: {insight.days_until_stockout}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default InsightsPanel
