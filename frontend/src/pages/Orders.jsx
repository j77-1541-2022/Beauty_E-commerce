import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Package,
  Truck,
  DollarSign,
  Calendar,
  BarChart3,
  TrendingUp,
  Users
} from 'lucide-react'
import { orderAPI } from '../services/apiClient'
import LoadingSpinner from '../components/LoadingSpinner'

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    revenue: 0
  })
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    subtotal: '',
    tax_amount: '',
    shipping_cost: '',
    notes: '',
    items: []
  })
  const [newItem, setNewItem] = useState({
    product: '',
    quantity: 1,
    unit_price: ''
  })

  const orderStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusIcons = {
    pending: <Calendar className="w-4 h-4" />,
    confirmed: <CheckCircle className="w-4 h-4" />,
    processing: <Package className="w-4 h-4" />,
    shipped: <Truck className="w-4 h-4" />,
    delivered: <CheckCircle className="w-4 h-4" />,
    cancelled: <Calendar className="w-4 h-4" />,
  }

  useEffect(() => {
    fetchOrders()
  }, [searchTerm, statusFilter])

  // Handle query params - set active tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Calculate order statistics whenever orders change
  useEffect(() => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      revenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    }
    setOrderStats(stats)
  }, [orders])

  const fetchOrders = async () => {
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter

      const response = await ordersAPI.getOrders(params)
      console.log('Orders API Response:', response)

      // Handle both response formats
      const ordersData = response.results || response.data || []
      setOrders(ordersData)
      console.log('Orders set:', ordersData.length, 'items')
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, { status: newStatus })
      fetchOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleConfirmOrder = async (orderId) => {
    try {
      await ordersAPI.confirmOrder(orderId)
      fetchOrders()
    } catch (error) {
      console.error('Failed to confirm order:', error)
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    try {
      await ordersAPI.createOrder(formData)
      setShowCreateModal(false)
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        subtotal: '',
        tax_amount: '',
        shipping_cost: '',
        notes: '',
        items: []
      })
      fetchOrders()
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  const addOrderItem = () => {
    if (newItem.product && newItem.quantity && newItem.unit_price) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem, total_price: newItem.quantity * newItem.unit_price }]
      }))
      setNewItem({ product: '', quantity: 1, unit_price: '' })
    }
  }

  const removeOrderItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Orders</h1>
          <p className="text-gray-600">Manage customer orders and view analytics</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Order</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders List</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales Analytics</span>
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <>
          {/* Filters */}
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              <button className="btn-secondary flex items-center justify-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${order.total_amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusIcons[order.status]}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowModal(true)
                            }}
                            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmOrder(order.id)}
                              className="p-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Confirm Order"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            title="Update Status"
                          >
                            {orderStatuses.filter(s => s.value).map(status => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">${orderStats.revenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
            <div className="space-y-4">
              {orderStatuses.filter(s => s.value).map(status => {
                const count = orders.filter(o => o.status === status.value).length
                const percentage = orderStats.total > 0 ? (count / orderStats.total) * 100 : 0
                return (
                  <div key={status.value} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{status.label}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusColors[status.value].split(' ')[0]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium text-gray-900">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Order {selectedOrder.order_number}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                {statusIcons[selectedOrder.status]}
                <span className="ml-1 capitalize">{selectedOrder.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                  <p className="text-sm"><span className="font-medium">Phone:</span> {selectedOrder.customer_phone || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Shipping Address:</span></p>
                  <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${selectedOrder.tax_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>${selectedOrder.shipping_cost}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span>${selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.total_price}</p>
                      <p className="text-sm text-gray-600">{item.quantity} × ${item.unit_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold gradient-text mb-6">Create New Order</h2>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address</label>
                  <input
                    type="text"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Orders
