import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, color, trend, warning = false, description = null }) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-500 to-accent-600',
    danger: 'from-red-500 to-red-600',
  }

  const bgClasses = {
    primary: 'bg-primary-100 text-primary-600',
    secondary: 'bg-secondary-100 text-secondary-600',
    accent: 'bg-accent-100 text-accent-600',
    danger: 'bg-red-100 text-red-600',
  }

  const isPositive = trend && trend.startsWith('+')

  return (
    <motion.div
      whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className={`stat-card ${warning ? 'border-l-4 border-red-500' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
            {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>

      {warning && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-600 mt-2"
        >
          Attention needed
        </motion.p>
      )}
    </motion.div>
  )
}

export default StatCard
