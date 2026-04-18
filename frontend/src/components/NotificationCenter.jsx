import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  ShoppingCart,
  Package,
  TrendingUp,
  Clock
} from 'lucide-react'

const NotificationCenter = ({ notifications, onClose, onClearAll }) => {
  const [filter, setFilter] = useState('all')

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'inventory':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-green-500" />
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'analytics':
        return <TrendingUp className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    return notification.type === filter
  })

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed right-4 top-20 w-96 max-h-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {notifications.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-200">
        {['all', 'inventory', 'order', 'alert', 'analytics'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === filterType
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-64">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeAgo(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>
                <button
                  className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                  onClick={() => {
                    // Handle marking as read
                  }}
                >
                  <Check className="w-4 h-4 text-gray-400" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Notifications
        </button>
      </div>
    </motion.div>
  )
}

export default NotificationCenter
