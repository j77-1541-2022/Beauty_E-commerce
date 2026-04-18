import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Calendar,
  DollarSign,
  Filter,
  Search,
  X,
  ChevronDown,
  Download,
  RefreshCw
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import SkeletonLoader from '../components/SkeletonLoader'
import { GlassCard } from '../components/ui/GlassCard'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import customerAPI from '../services/customerAPI'

const CustomerOrders = () => {
  const { user } = useCustomerAuth()
  const { colors, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const isDark = theme === 'dark'
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await customerAPI.getOrders()
      const ordersData = Array.isArray(response) ? response : response.results || []
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      // Use empty array on error
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'week' && isWithinWeek(order.created_at)) ||
      (dateFilter === 'month' && isWithinMonth(order.created_at)) ||
      (dateFilter === 'year' && isWithinYear(order.created_at))
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const isWithinWeek = (date) => {
    const orderDate = new Date(date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return orderDate >= weekAgo
  }

  const isWithinMonth = (date) => {
    const orderDate = new Date(date)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return orderDate >= monthAgo
  }

  const isWithinYear = (date) => {
    const orderDate = new Date(date)
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    return orderDate >= yearAgo
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-500" />
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'cancelled':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50'} p-4`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${colors.text}`}>My Orders</h1>
            <p className={`${colors.textMuted} mt-2`}>Track and manage your orders</p>
          </div>
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50'} p-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className={`text-3xl font-bold ${colors.text}`}>
              My Orders
            </h1>
            <p className={`${colors.textMuted} mt-2`}>
              Track and manage your orders
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.primary} text-white hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-3.5 w-5 h-5 ${colors.textMuted}`} />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${colors.input} ${colors.text} focus:ring-2 focus:ring-pink-500/20`}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className={`w-5 h-5 ${colors.textMuted}`} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-3 rounded-xl border transition-all duration-300 ${colors.input} ${colors.text} focus:ring-2 focus:ring-pink-500/20`}
                >
                  <option value="all">All Status</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className={`w-5 h-5 ${colors.textMuted}`} />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={`px-4 py-3 rounded-xl border transition-all duration-300 ${colors.input} ${colors.text} focus:ring-2 focus:ring-pink-500/20`}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Package className={`w-16 h-16 mx-auto ${colors.textMuted} mb-4`} />
              <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>
                No orders found
              </h3>
              <p className={colors.textMuted}>
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start shopping to see your orders here'
                }
              </p>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id || order.order_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6" hover>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`text-lg font-semibold ${colors.text}`}>
                            {order.order_number || order.id}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className={`flex items-center space-x-1 text-sm ${colors.textMuted}`}>
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(order.created_at || order.date).toLocaleDateString()}</span>
                            </div>
                            {order.tracking_number && (
                              <div className={`flex items-center space-x-1 text-sm ${colors.textMuted}`}>
                                <Package className="w-4 h-4" />
                                <span>{order.tracking_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {(order.items || []).map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between">
                            <div>
                              <p className={`${colors.text} font-medium`}>
                                {item.product_name || item.name}
                              </p>
                              <p className={`text-sm ${colors.textMuted}`}>
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className={`${colors.text} font-medium`}>
                              {formatPrice(item.price || item.unit_price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total and Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-right">
                        <p className={`text-sm ${colors.textMuted}`}>
                          Total
                        </p>
                        <p className={`text-2xl font-bold ${colors.text}`}>
                          {formatPrice(order.total_amount || order.total)}
                        </p>
                      </div>
                      
                      <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${colors.primary} text-white hover:opacity-90`}>
                        <span>View Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerOrders
