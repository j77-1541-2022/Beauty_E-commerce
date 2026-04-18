import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Area, AreaChart
} from 'recharts'
import { 
  FileText, Package, AlertTriangle, TrendingUp, PieChart as PieIcon, 
  Download, Calendar, Filter, ChevronDown, Table, FileSpreadsheet,
  Printer, RefreshCw
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import { dealerAPI } from '../../services/apiClient'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

const DealerReports = () => {
  const [activeTab, setActiveTab] = useState('inventory')
  const [loading, setLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState(null)
  const [lowStockData, setLowStockData] = useState(null)
  const [movementData, setMovementData] = useState(null)
  const [valuationData, setValuationData] = useState(null)
  
  // Stock movement filters
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [selectedProduct, setSelectedProduct] = useState('')
  const [availableProducts, setAvailableProducts] = useState([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [inventoryRes, lowStockRes, valuationRes] = await Promise.all([
        dealerAPI.getInventoryReport(),
        dealerAPI.getLowStockReport(),
        dealerAPI.getValuationReport()
      ])
      
      setInventoryData(inventoryRes.data)
      setLowStockData(lowStockRes.data)
      setValuationData(valuationRes.data)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMovementData = async () => {
    if (!startDate || !endDate) return
    
    try {
      setLoading(true)
      const params = {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        ...(selectedProduct && { product_id: selectedProduct })
      }
      
      const res = await dealerAPI.getStockMovementReport(params)
      setMovementData(res.data)
      setAvailableProducts(res.data.products || [])
    } catch (err) {
      console.error('Failed to load movement data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h]
        // Escape values with commas or quotes
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  // Print to PDF
  const printToPDF = (elementId, title) => {
    const printWindow = window.open('', '_blank')
    const content = document.getElementById(elementId).innerHTML
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            h1 { color: #333; }
            .summary { margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="summary">
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          ${content}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const tabs = [
    { id: 'inventory', label: 'Inventory Status', icon: Package },
    { id: 'lowstock', label: 'Low Stock', icon: AlertTriangle },
    { id: 'movement', label: 'Stock Movement', icon: TrendingUp },
    { id: 'valuation', label: 'Valuation', icon: PieIcon },
  ]

  if (loading && !inventoryData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
        </div>
        <SkeletonLoader type="table" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-pink-500" />
            Inventory Reports
          </h1>
          <p className="text-slate-600 mt-1">Comprehensive inventory analytics and reporting</p>
        </div>
        <button
          onClick={fetchInitialData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Status Report */}
      {activeTab === 'inventory' && inventoryData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Inventory Status Report</h2>
                <p className="text-slate-600">Total Value: {formatKSH(inventoryData.total_value)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportToCSV(inventoryData.inventory_data, 'inventory_report.csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => printToPDF('inventory-table', 'Inventory Status Report')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
            
            <div id="inventory-table" className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-700 font-medium">Product Name</th>
                    <th className="px-4 py-3 text-left text-slate-700 font-medium">Category</th>
                    <th className="px-4 py-3 text-left text-slate-700 font-medium">SKU</th>
                    <th className="px-4 py-3 text-center text-slate-700 font-medium">Current Stock</th>
                    <th className="px-4 py-3 text-center text-slate-700 font-medium">Reorder Level</th>
                    <th className="px-4 py-3 text-center text-slate-700 font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-slate-700 font-medium">Value (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {inventoryData.inventory_data?.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                      <td className="px-4 py-3 text-center text-slate-900">{item.current_stock}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{item.reorder_level}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'Low' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900">{formatKSH(item.value_kes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Low Stock Report */}
      {activeTab === 'lowstock' && lowStockData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Low Stock Report
                </h2>
                <p className="text-slate-600">{lowStockData.total_low_stock_items} products need attention</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportToCSV(lowStockData.low_stock_data, 'low_stock_report.csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => printToPDF('lowstock-table', 'Low Stock Report')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print PDF
                </button>
              </div>
            </div>
            
            <div id="lowstock-table" className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-500/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-red-300 font-medium">Product Name</th>
                    <th className="px-4 py-3 text-left text-red-300 font-medium">Category</th>
                    <th className="px-4 py-3 text-left text-red-300 font-medium">SKU</th>
                    <th className="px-4 py-3 text-center text-red-300 font-medium">Current Stock</th>
                    <th className="px-4 py-3 text-center text-red-300 font-medium">Reorder Level</th>
                    <th className="px-4 py-3 text-center text-red-300 font-medium">Suggested Reorder</th>
                    <th className="px-4 py-3 text-left text-red-300 font-medium">Supplier Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-500/10">
                  {lowStockData.low_stock_data?.map((item, index) => (
                    <tr key={index} className="hover:bg-red-500/5">
                      <td className="px-4 py-3 text-slate-900 font-medium">{item.product_name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                      <td className="px-4 py-3 text-center text-red-400 font-bold">{item.current_stock}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{item.reorder_level}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-sm font-medium">
                          {item.suggested_reorder} units
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.supplier_contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {lowStockData.low_stock_data?.length === 0 && (
                <div className="text-center py-8 text-slate-600">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No low stock items found. All inventory levels are healthy!</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Stock Movement Report */}
      {activeTab === 'movement' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Stock Movement Report
              </h2>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholderText="Select date range"
                  />
                </div>
                
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="" className="bg-gray-800">All Products</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-800">{p.name}</option>
                  ))}
                </select>
                
                <button
                  onClick={fetchMovementData}
                  disabled={!startDate || !endDate}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 disabled:opacity-50 text-pink-400 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Apply Filter
                </button>
              </div>
            </div>
            
            {movementData?.daily_summary?.length > 0 ? (
              <>
                {/* Chart */}
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={movementData.daily_summary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="total_in" name="Stock In" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="total_out" name="Stock Out" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="total_sale" name="Sales" stackId="3" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Recent Transactions</h3>
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Product</th>
                        <th className="px-4 py-3 text-center text-slate-700 font-medium">Type</th>
                        <th className="px-4 py-3 text-center text-slate-700 font-medium">Quantity</th>
                        <th className="px-4 py-3 text-center text-slate-700 font-medium">Before</th>
                        <th className="px-4 py-3 text-center text-slate-700 font-medium">After</th>
                        <th className="px-4 py-3 text-left text-slate-700 font-medium">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {movementData.transactions?.slice(0, 20).map((tx, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600 text-sm">
                            {new Date(tx.created_at).toLocaleDateString('en-KE')}
                          </td>
                          <td className="px-4 py-3 text-slate-900">{tx.dealer_inventory__product__name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.movement_type === 'in' ? 'bg-emerald-500/20 text-emerald-400' :
                              tx.movement_type === 'sale' ? 'bg-purple-500/20 text-purple-400' :
                              tx.movement_type === 'out' ? 'bg-red-500/20 text-red-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {tx.movement_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-900">{tx.quantity}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{tx.quantity_before}</td>
                          <td className="px-4 py-3 text-center text-slate-900">{tx.quantity_after}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm">{tx.reference || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">Select a date range to view stock movement</p>
                <p className="text-sm text-slate-500">Choose start and end dates, then click Apply Filter</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Valuation Report */}
      {activeTab === 'valuation' && valuationData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" />
              Inventory Value by Category
            </h2>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={valuationData.category_breakdown}
                    dataKey="total_value_kes"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                  >
                    {valuationData.category_breakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatKSH(value)}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Inventory Value</span>
                <span className="text-2xl font-bold text-slate-900">{formatKSH(valuationData.total_value_kes)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-600">Total Products</span>
                <span className="text-lg font-medium text-slate-900">{valuationData.total_products} items</span>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Category Breakdown</h2>
              <button
                onClick={() => exportToCSV(valuationData.category_breakdown, 'valuation_report.csv')}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-700 font-medium">Category</th>
                    <th className="px-4 py-3 text-center text-slate-700 font-medium">Items</th>
                    <th className="px-4 py-3 text-right text-slate-700 font-medium">Value (KES)</th>
                    <th className="px-4 py-3 text-right text-slate-700 font-medium">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {valuationData.category_breakdown?.map((cat, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900 flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {cat.category}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{cat.item_count}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{formatKSH(cat.total_value_kes)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700">
                          {cat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}

export default DealerReports
