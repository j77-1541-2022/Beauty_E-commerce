import React from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Home,
  Sparkles
} from 'lucide-react'

const OrderTimeline = ({ orderStatus, trackingNumber, estimatedDelivery }) => {
  const timelineSteps = [
    {
      id: 1,
      title: 'Order Placed',
      description: 'Your order has been received',
      icon: <CheckCircle className="w-5 h-5" />,
      status: 'completed',
      date: '2024-03-20',
      time: '10:30 AM'
    },
    {
      id: 2,
      title: 'Order Confirmed',
      description: 'Payment confirmed and order processed',
      icon: <CheckCircle className="w-5 h-5" />,
      status: 'completed',
      date: '2024-03-20',
      time: '11:15 AM'
    },
    {
      id: 3,
      title: 'Processing',
      description: 'Your order is being prepared',
      icon: <Package className="w-5 h-5" />,
      status: orderStatus === 'processing' ? 'active' : 'completed',
      date: '2024-03-20',
      time: '2:00 PM'
    },
    {
      id: 4,
      title: 'Shipped',
      description: `Order shipped via ${trackingNumber ? `tracking #${trackingNumber}` : 'standard shipping'}`,
      icon: <Truck className="w-5 h-5" />,
      status: orderStatus === 'shipped' ? 'active' : orderStatus === 'delivered' ? 'completed' : 'upcoming',
      date: orderStatus === 'shipped' || orderStatus === 'delivered' ? '2024-03-21' : 'TBD',
      time: orderStatus === 'shipped' || orderStatus === 'delivered' ? '9:00 AM' : 'TBD'
    },
    {
      id: 5,
      title: 'Out for Delivery',
      description: 'Your order is on its way to you',
      icon: <MapPin className="w-5 h-5" />,
      status: orderStatus === 'delivered' ? 'completed' : orderStatus === 'shipped' ? 'active' : 'upcoming',
      date: orderStatus === 'delivered' ? '2024-03-22' : 'TBD',
      time: orderStatus === 'delivered' ? '10:30 AM' : 'TBD'
    },
    {
      id: 6,
      title: 'Delivered',
      description: 'Order delivered successfully',
      icon: <Home className="w-5 h-5" />,
      status: orderStatus === 'delivered' ? 'active' : 'upcoming',
      date: orderStatus === 'delivered' ? '2024-03-22' : estimatedDelivery || 'TBD',
      time: orderStatus === 'delivered' ? '2:00 PM' : 'TBD'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500'
      case 'active':
        return 'bg-purple-500 text-white border-purple-500'
      case 'upcoming':
        return 'bg-white/20 text-white border-white/30'
      default:
        return 'bg-white/20 text-white border-white/30'
    }
  }

  const getLineColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'active':
        return 'bg-purple-500'
      case 'upcoming':
        return 'bg-white/30'
      default:
        return 'bg-white/30'
    }
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/30" />
      
      {/* Timeline Steps */}
      <div className="space-y-8">
        {timelineSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative flex items-start space-x-4"
          >
            {/* Timeline Dot */}
            <motion.div
              className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${getStatusColor(step.status)}`}
              whileHover={{ scale: 1.1 }}
            >
              {step.status === 'active' && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-500 opacity-30"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              {step.icon}
            </motion.div>
            
            {/* Timeline Content */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                className={`p-4 rounded-lg border transition-colors ${
                  step.status === 'active' 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : step.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-purple-200 text-sm mb-2">{step.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-purple-300">
                      <span>{step.date}</span>
                      {step.time !== 'TBD' && <span>{step.time}</span>}
                    </div>
                  </div>
                  {step.status === 'active' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Estimated Delivery */}
      {orderStatus !== 'delivered' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-white font-medium">Estimated Delivery</p>
              <p className="text-purple-200 text-sm">{estimatedDelivery || 'TBD'}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default OrderTimeline
