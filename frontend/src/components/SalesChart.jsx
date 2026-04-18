import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts'
import { BarChart3, TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react'

const SalesChart = ({ data }) => {
  const [chartType, setChartType] = useState('line')
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('sales')

  // Handle undefined or null data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="chart-container"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
              <p className="text-sm text-gray-600">Last 30 days performance</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No sales data available</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date()
    let daysBack = 30
    
    switch (timeRange) {
      case '7d':
        daysBack = 7
        break
      case '30d':
        daysBack = 30
        break
      case '90d':
        daysBack = 90
        break
      case '1y':
        daysBack = 365
        break
      default:
        daysBack = 30
    }
    
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    return data.filter(item => new Date(item.date) >= cutoffDate)
  }, [data, timeRange])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredData.length) return { total: 0, average: 0, growth: 0, peak: 0 }
    
    const total = filteredData.reduce((sum, item) => sum + (item.daily_sales || 0), 0)
    const average = total / filteredData.length
    const peak = Math.max(...filteredData.map(item => item.daily_sales || 0))
    
    // Calculate growth (comparing first half to second half)
    const midPoint = Math.floor(filteredData.length / 2)
    const firstHalf = filteredData.slice(0, midPoint).reduce((sum, item) => sum + (item.daily_sales || 0), 0)
    const secondHalf = filteredData.slice(midPoint).reduce((sum, item) => sum + (item.daily_sales || 0), 0)
    const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
    
    return { total, average, growth, peak }
  }, [filteredData])

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatYAxis = (value) => {
    return `$${(value / 1000).toFixed(1)}k`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <p className="text-sm text-gray-600">Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : 'year'} performance</p>
          </div>
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7D' : range === '30d' ? '30D' : range === '90d' ? '90D' : '1Y'}
              </button>
            ))}
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </button>
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
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Sales</p>
              <p className="text-lg font-bold text-blue-900">${stats.total.toFixed(0)}</p>
            </div>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Average</p>
              <p className="text-lg font-bold text-green-900">${stats.average.toFixed(0)}</p>
            </div>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Peak Day</p>
              <p className="text-lg font-bold text-purple-900">${stats.peak.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
        </div>
        <div className={`${stats.growth >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-3`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>Growth</p>
              <p className={`text-lg font-bold ${stats.growth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className={`w-4 h-4 ${stats.growth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
              labelFormatter={(label) => formatXAxis(label)}
            />
            <Line
              type="monotone"
              dataKey="daily_sales"
              stroke="url(#colorGradient)"
              strokeWidth={3}
              dot={{ fill: '#d946ef', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
          </LineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
              labelFormatter={(label) => formatXAxis(label)}
            />
            <Area
              type="monotone"
              dataKey="daily_sales"
              stroke="url(#colorGradient)"
              fill="url(#areaGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#d946ef" stopOpacity={0.05} />
              </linearGradient>
            </defs>
          </AreaChart>
        ) : (
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']}
              labelFormatter={(label) => formatXAxis(label)}
            />
            <Bar dataKey="daily_sales" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  )
}

export default SalesChart
