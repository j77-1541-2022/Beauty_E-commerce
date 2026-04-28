import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  Filter,
  Search,
  X,
  ChevronDown,
  Download,
  RefreshCw,
  Trash2
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
      const ordersData = Array.isArray(response)
        ? response
        : response?.results || response?.data?.results || response?.data || []
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

  const isWithinWeek = (date) => {
    if (!date) return false
    const orderDate = new Date(date)
    if (Number.isNaN(orderDate.getTime())) return false
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return orderDate >= weekAgo
  }

  const isWithinMonth = (date) => {
    if (!date) return false
    const orderDate = new Date(date)
    if (Number.isNaN(orderDate.getTime())) return false
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return orderDate >= monthAgo
  }

  const isWithinYear = (date) => {
    if (!date) return false
    const orderDate = new Date(date)
    if (Number.isNaN(orderDate.getTime())) return false
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    return orderDate >= yearAgo
  }

  const canDeleteOrder = (order) => {
    const status = (order?.status || '').toLowerCase()
    return ['delivered', 'cancelled', 'refunded'].includes(status)
  }

  const handleDeleteOrder = async (order) => {
    if (!order?.id) return
    const confirmed = window.confirm(`Delete order ${order.order_number || order.id} from your history?`)
    if (!confirmed) return

    try {
      await customerAPI.deleteOrder(order.id)
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null)
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to delete order.'
      alert(message)
    }
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-500" />
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
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
      case 'paid':
        return 'bg-emerald-100 text-emerald-800'
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
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className={`flex items-center gap-2 ${colors.textMuted} hover:${colors.text} transition-colors`}>
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${colors.text}`}>
                My Orders
              </h1>
              <p className={`${colors.textMuted} mt-2`}>
                Track and manage your orders
              </p>
            </div>
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
                  <option value="paid">Paid</option>
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
                      
                      <div className="flex items-center gap-2">
                        {order.id && (
                          <Link
                            to={`/customer/orders/${order.id}/track`}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-blue-400/40 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                          >
                            <span>Track Order</span>
                            <Truck className="w-4 h-4" />
                          </Link>
                        )}
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${colors.primary} text-white hover:opacity-90`}
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {canDeleteOrder(order) && (
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300"
                          >
                            <span>Delete</span>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${colors.text}`}>
                    Order Details
                  </h2>
                  <p className={`${colors.textMuted}`}>
                    {selectedOrder.order_number || selectedOrder.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`p-2 rounded-lg hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Order Status */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(selectedOrder.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {(selectedOrder.status || 'Unknown').charAt(0).toUpperCase() + (selectedOrder.status || 'Unknown').slice(1)}
                  </span>
                </div>
                <p className={`text-sm ${colors.textMuted}`}>
                  Ordered on {new Date(selectedOrder.created_at || selectedOrder.date).toLocaleDateString()}
                </p>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className={`font-semibold mb-3 ${colors.text}`}>Items</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`font-medium ${colors.text}`}>
                          {item.product_name || item.name}
                        </p>
                        <p className={`text-sm ${colors.textMuted}`}>
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className={`font-medium ${colors.text}`}>
                        {formatPrice(item.price || item.unit_price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-3 ${colors.text}`}>Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={colors.textMuted}>Subtotal</span>
                    <span className={colors.text}>{formatPrice((selectedOrder.total_amount || selectedOrder.total || 0) * 0.9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.textMuted}>Shipping</span>
                    <span className={colors.text}>{formatPrice((selectedOrder.total_amount || selectedOrder.total || 0) * 0.1)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span className={colors.text}>Total</span>
                    <span className={colors.text}>{formatPrice(selectedOrder.total_amount || selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="mb-6">
                  <h3 className={`font-semibold mb-2 ${colors.text}`}>Shipping Address</h3>
                  <p className={`${colors.textMuted}`}>{selectedOrder.shipping_address}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {selectedOrder.id && (
                  <Link
                    to={`/customer/orders/${selectedOrder.id}/track`}
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Track Order
                  </Link>
                )}
                <button
                  onClick={async () => {
                    try {
                      const orderId = selectedOrder.id
                      const response = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/receipt/`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
                        }
                      })
                      
                      if (!response.ok) throw new Error('Failed to download')
                      
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `receipt_${selectedOrder.order_number || orderId}.pdf`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      window.URL.revokeObjectURL(url)
                    } catch (error) {
                      console.error('Failed to download receipt:', error)
                      alert('Failed to download receipt. Please try again.')
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}
                >
                  Close
                </button>
                {canDeleteOrder(selectedOrder) && (
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Order
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerOrders
