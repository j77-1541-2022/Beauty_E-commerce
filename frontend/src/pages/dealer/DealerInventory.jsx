import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, AlertCircle, Plus, Minus, TrendingUp, Search, Filter,
  RefreshCw, ArrowUpDown, X, Edit3, Calendar, AlertTriangle
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { dealerAPI } from '../../services/apiClient'

const DealerInventory = () => {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [adjustmentData, setAdjustmentData] = useState({
    quantity_change: '',
    reason: ''
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    filterAndSortInventory()
  }, [inventory, searchTerm, filter, sortConfig])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const res = await dealerAPI.getInventory()
      const data = Array.isArray(res.data) ? res.data : []
      setInventory(data)
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortInventory = () => {
    let filtered = [...inventory]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filter === 'low') {
      filtered = filtered.filter(item => item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level)
    } else if (filter === 'out') {
      filtered = filtered.filter(item => item.stock_quantity === 0)
    } else if (filter === 'in') {
      filtered = filtered.filter(item => item.stock_quantity > item.reorder_level)
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    }

    setFilteredInventory(filtered)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleStockAdjustment = async (inventoryId) => {
    try {
      const newQuantity = parseInt(adjustmentData.quantity_change)
      await dealerAPI.updateInventory(inventoryId, {
        stock_quantity: newQuantity,
        reason: adjustmentData.reason
      })
      setShowModal(false)
      setAdjustmentData({ quantity_change: '', reason: '' })
      setSelectedItem(null)
      fetchInventory()
    } catch (err) {
      console.error('Failed to adjust stock:', err)
    }
  }

  const openAdjustmentModal = (item) => {
    setSelectedItem(item)
    setAdjustmentData({ quantity_change: item.stock_quantity.toString(), reason: '' })
    setShowModal(true)
  }

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' }
    if (quantity <= reorderLevel) return { status: 'Low Stock', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    return { status: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }

  // Calculate statistics
  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(item => item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level).length,
    outOfStock: inventory.filter(item => item.stock_quantity === 0).length,
    inStock: inventory.filter(item => item.stock_quantity > item.reorder_level).length,
    totalValue: inventory.reduce((acc, item) => acc + (item.stock_quantity * (item.unit_price || item.unit_cost || 0)), 0)
  }

  const formatKSH = (amount) => `KSh ${amount?.toLocaleString('en-KE') || '0'}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your product stock levels</p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-xl font-bold text-emerald-600">{stats.inStock}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-amber-600">{stats.lowStock}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Inventory Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center gap-1">
                    Product
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stock_quantity')}
                >
                  <div className="flex items-center gap-1">
                    Current Stock
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reorder Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No inventory items found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm ? 'Try adjusting your search' : 'Add products to start managing inventory'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item.stock_quantity, item.reorder_level)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.product_sku}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <span className={`font-semibold ${
                            item.stock_quantity <= item.reorder_level ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.stock_quantity}
                          </span>
                          <span className="text-gray-500 ml-1">units</span>
                        </div>
                        {/* Stock Progress Bar */}
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.stock_quantity === 0 ? 'bg-red-500' :
                              item.stock_quantity <= item.reorder_level ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min((item.stock_quantity / Math.max(item.reorder_level * 2, 100)) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.reorder_level} units
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.last_stock_update
                            ? new Date(item.last_stock_update).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => openAdjustmentModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredInventory.length} of {inventory.length} items
          </p>
        </div>
      </GlassCard>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Adjust Stock</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedItem.product_name}</h3>
                <p className="text-sm text-gray-500">SKU: {selectedItem.product_sku}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Current stock: <span className="font-semibold">{selectedItem.stock_quantity}</span> units
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                handleStockAdjustment(selectedItem.id)
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={adjustmentData.quantity_change}
                    onChange={(e) => setAdjustmentData({...adjustmentData, quantity_change: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the total new quantity (not the difference)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Adjustment
                  </label>
                  <select
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select reason...</option>
                    <option value="new_stock">New Stock Arrival</option>
                    <option value="damaged">Damaged/Expired Products</option>
                    <option value="sold">Manual Sale/Offline Sale</option>
                    <option value="adjustment">Stock Count Adjustment</option>
                    <option value="return">Customer Return</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DealerInventory