import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Plus,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Download,
  Filter,
  Truck,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

const QuickActions = ({ data }) => {
  const actions = [
    {
      title: 'Add Product',
      description: 'Add new product to inventory',
      icon: Plus,
      color: 'bg-blue-500',
      link: '/admin/products?action=add',  // Fixed: use admin route with query param
      badge: null
    },
    {
      title: 'View Orders',
      description: `${data?.pendingOrders || 0} pending orders`,
      icon: ShoppingCart,
      color: 'bg-green-500',
      link: '/admin/orders',  // Fixed: use admin route
      badge: data?.pendingOrders || 0
    },
    {
      title: 'Low Stock Alert',
      description: `${data?.lowStockItems || 0} items need restock`,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      link: '/admin/inventory?filter=low_stock',  // Fixed: use admin route
      badge: data?.lowStockItems || 0
    },
    {
      title: 'Sales Report',
      description: 'Generate sales analytics',
      icon: BarChart3,
      color: 'bg-purple-500',
      link: '/admin/orders?tab=analytics',  // Fixed: link to orders with analytics tab
      badge: null
    },
    {
      title: 'Manage Suppliers',
      description: 'Supplier and vendor management',
      icon: Truck,
      color: 'bg-indigo-500',
      link: '/admin/inventory?tab=suppliers',  // Fixed: link to inventory suppliers tab
      badge: null
    },
    {
      title: 'Customer Insights',
      description: 'View customer analytics',
      icon: Users,
      color: 'bg-pink-500',
      link: '/admin/dashboard?tab=customers',  // Fixed: link to dashboard customers tab
      badge: null
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
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
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
          View All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={action.link}
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    {action.badge !== null && action.badge > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.totalRevenue ? `$${data.totalRevenue.toFixed(0)}` : '$0'}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+12.5%</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.totalOrders || 0}
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+8.2%</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.totalProducts || 0}
            </div>
            <div className="text-sm text-gray-600">Products</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+3.1%</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data?.outOfStockItems || 0}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
            <div className="flex items-center justify-center mt-1">
              {data?.outOfStockItems > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-xs text-red-600">Action needed</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">All good</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default QuickActions
