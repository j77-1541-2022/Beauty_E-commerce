import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Eye
} from 'lucide-react'
import { inventoryAPI } from '../services/apiClient'
import LoadingSpinner from '../components/LoadingSpinner'

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inventory, setInventory] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [outOfStockItems, setOutOfStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockForm, setStockForm] = useState({
    quantity: '',
    reference: '',
    notes: '',
    type: 'in'
  })

  useEffect(() => {
    fetchInventory()
    fetchAlerts()
  }, [searchTerm, filter])

  // Handle query params - set filter from URL
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam) {
      setFilter(filterParam)
    }
  }, [searchParams])

  const fetchInventory = async () => {
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (filter !== 'all') params.stock_status = filter

      const response = await inventoryAPI.getInventory(params)
      setInventory(response.results || response.data || [])
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const [lowStock, outOfStock] = await Promise.all([
        inventoryAPI.getLowStock(),
        inventoryAPI.getOutOfStock()
      ])
      setLowStockItems(lowStock.results || lowStock.data || [])
      setOutOfStockItems(outOfStock.results || outOfStock.data || [])
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  const handleStockMovement = async (e) => {
    e.preventDefault()
    try {
      const data = {
        quantity: parseInt(stockForm.quantity),
        reference: stockForm.reference,
        notes: stockForm.notes
      }

      if (stockForm.type === 'in') {
        await inventoryAPI.stockIn(selectedItem.id, data)
      } else {
        await inventoryAPI.stockOut(selectedItem.id, data)
      }

      setShowStockModal(false)
      setSelectedItem(null)
      setStockForm({ quantity: '', reference: '', notes: '', type: 'in' })
      fetchInventory()
      fetchAlerts()
    } catch (error) {
      console.error('Failed to update stock:', error)
    }
  }

  const openStockModal = (item, type) => {
    setSelectedItem(item)
    setStockForm({ ...stockForm, type })
    setShowStockModal(true)
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800'
      case 'low_stock':
        return 'bg-orange-100 text-orange-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'in_stock':
        return <TrendingUp className="w-4 h-4" />
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4" />
      case 'out_of_stock':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Inventory</h1>
          <p className="text-gray-600">Manage your stock levels and movements</p>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lowStockItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 border-l-4 border-orange-500"
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                  {lowStockItems.length} items
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.product.name}</span>
                    <span className="text-orange-600 font-medium">{item.quantity} left</span>
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <p className="text-xs text-gray-500">...and {lowStockItems.length - 3} more</p>
                )}
              </div>
            </motion.div>
          )}

          {outOfStockItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 border-l-4 border-red-500"
            >
              <div className="flex items-center space-x-3 mb-4">
                <TrendingDown className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                  {outOfStockItems.length} items
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {outOfStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.product.name}</span>
                    <span className="text-red-600 font-medium">0 left</span>
                  </div>
                ))}
                {outOfStockItems.length > 3 && (
                  <p className="text-xs text-gray-500">...and {outOfStockItems.length - 3} more</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Items</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>In Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Low Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Out of Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Level
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
              {inventory.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">{item.product.category_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${item.quantity <= item.reorder_level ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.reorder_level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.stock_status)}`}>
                      {getStockStatusIcon(item.stock_status)}
                      <span className="ml-1">
                        {item.stock_status === 'in_stock' ? 'In Stock' :
                          item.stock_status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openStockModal(item, 'in')}
                        className="p-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="Stock In"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openStockModal(item, 'out')}
                        className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Stock Out"
                        disabled={item.quantity === 0}
                      >
                        <ArrowDownCircle className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Modal */}
      {showStockModal && selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowStockModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold gradient-text mb-6">
              {stockForm.type === 'in' ? 'Stock In' : 'Stock Out'} - {selectedItem.product.name}
            </h2>

            <form onSubmit={handleStockMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={stockForm.type === 'out' ? selectedItem.quantity : undefined}
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference (Optional)</label>
                <input
                  type="text"
                  value={stockForm.reference}
                  onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
                  className="input-field"
                  placeholder="Invoice #, Order ID, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Current Stock: <span className="font-semibold">{selectedItem.quantity}</span>
                </p>
                <p className="text-sm text-gray-600">
                  After {stockForm.type === 'in' ? 'Stock In' : 'Stock Out'}:
                  <span className="font-semibold">
                    {stockForm.quantity ?
                      (stockForm.type === 'in' ?
                        selectedItem.quantity + parseInt(stockForm.quantity) :
                        selectedItem.quantity - parseInt(stockForm.quantity)) :
                      selectedItem.quantity
                    }
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${stockForm.type === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                  {stockForm.type === 'in' ? 'Stock In' : 'Stock Out'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Inventory
