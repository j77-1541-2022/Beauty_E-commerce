import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Search, Package, X } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { useNotification } from '../../contexts/NotificationContext'
import { dealerAPI } from '../../services/apiClient'

const DealerOrdersManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const { showNotification } = useNotification()

  const formatKSH = (value) => `KSh ${value?.toLocaleString('en-KE')}`

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'approval_pending', label: 'Approval Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  const statusOptions = filters.filter((f) => f.key !== 'all')

  const nextStatusFlow = {
    pending: 'paid',
    paid: 'approval_pending',
    approval_pending: 'approved',
    approved: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  }

  const getNextStatus = (currentStatus) => nextStatusFlow[currentStatus] || null

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.status = filter
      if (search.trim()) params.search = search.trim()

      const response = await dealerAPI.getOrders(params)
      setOrders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error(error)
      showNotification('Failed to fetch dealer orders', 'error')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId)
    try {
      await dealerAPI.updateOrderStatus(orderId, status)
      showNotification(`Order updated to ${status}`, 'success')
      await fetchOrders()
    } catch (error) {
      showNotification('Failed to update order status', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const bulkUpdateStatus = async () => {
    if (selectedOrders.size === 0) {
      showNotification('Select at least one order', 'warning')
      return
    }
    if (!bulkStatus) {
      showNotification('Select status for bulk update', 'warning')
      return
    }

    setBulkUpdating(true)
    try {
      const response = await dealerAPI.bulkUpdateOrderStatus(Array.from(selectedOrders), bulkStatus)
      const updatedCount = response?.data?.updated_count || 0
      showNotification(`Updated ${updatedCount} order(s)`, 'success')
      setSelectedOrders(new Set())
      setBulkStatus('')
      await fetchOrders()
    } catch (error) {
      showNotification('Bulk status update failed', 'error')
    } finally {
      setBulkUpdating(false)
    }
  }

  const toggleOrderSelection = (orderId) => {
    const next = new Set(selectedOrders)
    if (next.has(orderId)) {
      next.delete(orderId)
    } else {
      next.add(orderId)
    }
    setSelectedOrders(next)
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
      return
    }
    setSelectedOrders(new Set(orders.map((order) => order.id)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dealer Orders Management</h1>
        <p className="text-gray-600">Filter and bulk update orders for your products</p>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search order number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && fetchOrders()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === item.key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {selectedOrders.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">{selectedOrders.size} order(s) selected</span>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              className="px-3 py-1 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status</option>
              {statusOptions.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
            <button
              onClick={bulkUpdateStatus}
              disabled={bulkUpdating}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkUpdating ? 'Updating...' : 'Apply'}
            </button>
            <button onClick={() => setSelectedOrders(new Set())} className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded-lg text-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No orders found</p>
          </GlassCard>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={selectedOrders.size === orders.length && orders.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
            {orders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className={`overflow-hidden ${selectedOrders.has(order.id) ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                      <div onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="flex-1 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">#{order.order_number}</p>
                          <p className="text-sm text-gray-500">{order.customer_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">{order.status}</span>
                      <p className="font-semibold">{formatKSH(order.total_amount)}</p>
                      {expandedOrder === order.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-gray-100">
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Order Items</p>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                  <div>
                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="font-medium">{formatKSH(item.price * item.quantity)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {getNextStatus(order.status) && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => updateStatus(order.id, getNextStatus(order.status))}
                                disabled={updating === order.id}
                                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                              >
                                {updating === order.id ? 'Updating...' : `Mark as ${getNextStatus(order.status)}`}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default DealerOrdersManagement
