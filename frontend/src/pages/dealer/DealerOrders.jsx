import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Search, Package, Check, X } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { useNotification } from '../../contexts/NotificationContext'
import { dealerAPI } from '../../services/apiClient'

const DealerOrders = () => {
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

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (search) params.append('search', search)
      
      const res = await dealerAPI.getOrders(Object.fromEntries(params.entries()))
      setOrders(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      const res = await dealerAPI.updateOrderStatus(orderId, newStatus)
      if (res.status === 200) {
        showNotification(`Order updated to ${newStatus}`, 'success')
        fetchOrders()
      } else {
        showNotification('Failed to update status', 'error')
      }
    } catch (err) {
      showNotification('Network error', 'error')
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
      showNotification('Select a status', 'warning')
      return
    }

    setBulkUpdating(true)
    try {
      const res = await dealerAPI.bulkUpdateOrderStatus(Array.from(selectedOrders), bulkStatus)
      showNotification(`Updated ${res.data.updated_count} order(s)`, 'success')
      setSelectedOrders(new Set())
      setBulkStatus('')
      fetchOrders()
    } catch (err) {
      showNotification('Bulk update failed', 'error')
    } finally {
      setBulkUpdating(false)
    }
  }

  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    }
  }

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE')}`

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
  ]

  const statusOptions = [
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ]

  const getNextStatus = (current) => {
    const flow = { pending: 'processing', processing: 'shipped', shipped: null }
    return flow[current]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">Manage orders containing your products</p>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === f.key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {selectedOrders.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.size} order(s) selected
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status</option>
              {statusOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
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
            <button
              onClick={() => setSelectedOrders(new Set())}
              className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded-lg text-sm"
            >
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
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard
                  className={`overflow-hidden ${
                    selectedOrders.has(order.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                      <div
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="flex-1 flex items-center gap-4"
                      >
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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                      <p className="font-semibold">{formatKSH(order.total_amount)}</p>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Order Items</p>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{item.product_name}</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
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
            ))}
          </div>
        </div>
      </GlassCard>

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
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                    <p className="font-semibold">{formatKSH(order.total_amount)}</p>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Order Items</p>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  </div>
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
          ))
        )}
      </div>
    </div>
  )
}

export default DealerOrders
