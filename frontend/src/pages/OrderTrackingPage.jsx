import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Package,
  ArrowLeft,
  Loader,
  RefreshCw
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { orderAPI } from '../services/apiClient'
import BeautyLogo from '../components/BeautyLogo'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'

const OrderTrackingPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useCustomerAuth()
  const { isDark } = useTheme()
  const { showNotification } = useNotification()

  const [loading, setLoading] = useState(true)
  const [trackingData, setTrackingData] = useState(null)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchTrackingData()

    // Auto-refresh every 10 seconds for dynamic real-time updates
    const intervalId = setInterval(() => {
      // Only refresh if we have a valid id and no error
      if (id && id !== 'undefined' && !error) {
        fetchTrackingData(true) // true = isAutoRefresh
      }
    }, 10000) // 10 seconds for faster updates

    return () => clearInterval(intervalId)
  }, [id, user, navigate])

  const fetchTrackingData = async (isAutoRefresh = false) => {
    // Guard clause - don't fetch if id is undefined or invalid
    if (!id || id === 'undefined') {
      setError('Invalid order ID')
      setLoading(false)
      showNotification('Invalid order ID', 'error')
      return
    }

    try {
      if (isAutoRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await orderAPI.getTimeline(id)
      if (response?.data?.data) {
        setTrackingData(response.data.data)
        setLastUpdated(new Date())
        setError(null)
        
        // Show notification on auto-refresh if status changed
        if (isAutoRefresh && trackingData && trackingData.current_status !== response.data.data.current_status) {
          showNotification(`Order status updated: ${response.data.data.current_status}`, 'info')
        }
      } else {
        throw new Error('Invalid response structure')
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err)
      if (!isAutoRefresh) {
        setError('Failed to load order tracking information')
        showNotification('Failed to load order tracking', 'error')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = (status) => {
    const iconProps = { className: 'w-6 h-6' }
    const statusMap = {
      'pending': <Clock {...iconProps} />,
      'paid': <CheckCircle {...iconProps} />,
      'approval_pending': <Clock {...iconProps} />,
      'approved': <CheckCircle {...iconProps} />,
      'processing': <Package {...iconProps} />,
      'shipped': <Truck {...iconProps} />,
      'delivered': <CheckCircle {...iconProps} />
    }
    return statusMap[status] || <Clock {...iconProps} />
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'text-yellow-400',
      'paid': 'text-blue-400',
      'approval_pending': 'text-yellow-400',
      'approved': 'text-green-400',
      'processing': 'text-blue-400',
      'shipped': 'text-purple-400',
      'delivered': 'text-green-400'
    }
    return colorMap[status] || 'text-gray-400'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatStatusDisplay = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-100 to-blue-100'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Loading order tracking...</p>
        </div>
      </div>
    )
  }

  if (error || !trackingData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-100 to-blue-100'}`}>
        <GlassCard className="p-8 max-w-md">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Order Not Found
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {error || 'Unable to load order tracking information'}
          </p>
          <AnimatedButton onClick={() => navigate('/orders')} className="w-full">
            Back to Orders
          </AnimatedButton>
        </GlassCard>
      </div>
    )
  }

  const progressPercentage = {
    'pending': 10,
    'paid': 25,
    'approval_pending': 30,
    'approved': 40,
    'processing': 60,
    'shipped': 80,
    'delivered': 100
  }

  const currentProgress = progressPercentage[trackingData.current_status] || 0

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-100 to-blue-100'} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-2 mb-4 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Order Tracking
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Order #{trackingData.order_number}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <BeautyLogo />
            {/* Refresh Button */}
            <button
              onClick={() => fetchTrackingData(false)}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors disabled:opacity-50`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {/* Last Updated Timestamp */}
            {lastUpdated && (
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Delivery Progress
              </h3>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentProgress}% Complete
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Current Status: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatStatusDisplay(trackingData.current_status)}</span>
              </span>
              {trackingData.estimated_delivery && (
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Est. Delivery: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{trackingData.estimated_delivery}</span>
                </span>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Order Timeline
            </h3>

            <div className="space-y-4">
              {trackingData.timeline && trackingData.timeline.length > 0 ? (
                trackingData.timeline.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    className="flex gap-4"
                  >
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-purple-100'}`}>
                        <div className={getStatusColor(event.new_status)}>
                          {getStatusIcon(event.new_status)}
                        </div>
                      </div>
                      {index < trackingData.timeline.length - 1 && (
                        <div className={`w-1 h-12 ${isDark ? 'bg-gray-700' : 'bg-purple-200'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatStatusDisplay(event.new_status)}
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(event.changed_at)}
                          </p>
                          {event.notes && (
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-700'}`}>
                              {event.notes}
                            </p>
                          )}
                          {event.changed_by_name && (
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                              by {event.changed_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No timeline events available yet
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <AnimatedButton onClick={() => navigate('/orders')} variant="secondary">
            View All Orders
          </AnimatedButton>
          <AnimatedButton onClick={() => navigate('/')}>
            Continue Shopping
          </AnimatedButton>
        </motion.div>
      </div>
    </div>
  )
}

export default OrderTrackingPage
