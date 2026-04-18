import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Trophy, TrendingUp, Package, DollarSign, Eye } from 'lucide-react'

const TopProductsChart = ({ data }) => {
  const [chartType, setChartType] = useState('bar')
  const [metric, setMetric] = useState('sold')
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Handle undefined or null data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="chart-container"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-secondary-500 to-secondary-600 text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-600">Best selling items</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No product data available</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Process data for different chart types
  const chartData = useMemo(() => {
    const topProducts = data.slice(0, chartType === 'pie' ? 8 : 5)
    return topProducts.map(item => ({
      name: item.product_name && item.product_name.length > 15 ?
        item.product_name.substring(0, 15) + '...' :
        (item.product_name || 'Unknown Product'),
      fullName: item.product_name || 'Unknown Product',
      sold: item.total_sold || 0,
      revenue: item.total_revenue || 0,
      rating: item.rating || 0,
      views: item.views || 0
    }))
  }, [data, chartType])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.length) return { totalSold: 0, totalRevenue: 0, avgRating: 0, topProduct: '' }
    
    const totalSold = chartData.reduce((sum, item) => sum + item.sold, 0)
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
    const avgRating = chartData.reduce((sum, item) => sum + item.rating, 0) / chartData.length
    const topProduct = chartData[0]?.fullName || ''
    
    return { totalSold, totalRevenue, avgRating, topProduct }
  }, [chartData])

  // Pie chart colors
  const COLORS = ['#d946ef', '#eab308', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
          <p className="text-sm text-gray-600">Units Sold: {data.sold}</p>
          <p className="text-sm text-gray-600">Revenue: ${data.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Rating: {data.rating.toFixed(1)} ⭐</p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-secondary-500 to-secondary-600 text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <p className="text-sm text-gray-600">Best performing items</p>
          </div>
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'pie'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pie
            </button>
          </div>
          
          {/* Metric Selector */}
          {chartType === 'bar' && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMetric('sold')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  metric === 'sold'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Units
              </button>
              <button
                onClick={() => setMetric('revenue')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  metric === 'revenue'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 font-medium">Total Sold</p>
              <p className="text-lg font-bold text-orange-900">{stats.totalSold}</p>
            </div>
            <Package className="w-4 h-4 text-orange-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Revenue</p>
              <p className="text-lg font-bold text-green-900">${stats.totalRevenue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Avg Rating</p>
              <p className="text-lg font-bold text-purple-900">{stats.avgRating.toFixed(1)}⭐</p>
            </div>
            <Trophy className="w-4 h-4 text-purple-500" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Top Product</p>
              <p className="text-sm font-bold text-blue-900 truncate">{stats.topProduct}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={metric}
              fill="url(#barGradient)"
              radius={[0, 8, 8, 0]}
              onClick={(data) => setSelectedProduct(data)}
              cursor="pointer"
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => entry.name}
              outerRadius={80}
              fill="#8884d8"
              dataKey="sold"
              onClick={(data) => setSelectedProduct(data)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )}
      </ResponsiveContainer>
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedProduct(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.fullName}</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Units Sold:</span>
                <span className="font-semibold">{selectedProduct.sold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-semibold">${selectedProduct.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating:</span>
                <span className="font-semibold">{selectedProduct.rating.toFixed(1)} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-semibold">{selectedProduct.views}</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default TopProductsChart
