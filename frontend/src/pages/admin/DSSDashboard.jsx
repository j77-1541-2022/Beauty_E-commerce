import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import {
  AlertTriangle, AlertCircle, CheckCircle, Package,
  RefreshCw, ShoppingCart, TrendingDown, TrendingUp, Sparkles,
  Target, Activity, PieChart as PieIcon, BarChart3
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { useNotification } from '../../contexts/NotificationContext'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

const DSSDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('urgency')
  const [selectedCard, setSelectedCard] = useState(null)
  const { showNotification } = useNotification()
  const sectionRefs = {
    critical: useRef(null),
    low: useRef(null),
    overstock: useRef(null),
    healthy: useRef(null)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/inventory_insights/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error(err)
      showNotification('Failed to load insights', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const scrollToSection = (key) => {
    setSelectedCard(key)
    sectionRefs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleCreatePO = (product) => {
    showNotification(`Purchase Order for ${product.product_name} coming soon!`, 'info')
  }

  const getSortedRecommendations = () => {
    if (!data?.reorder_recommendations) return []
    const sorted = [...data.reorder_recommendations]
    if (sortBy === 'urgency') {
      const order = { critical: 0, high: 1, medium: 2 }
      sorted.sort((a, b) => order[a.urgency] - order[b.urgency])
    } else {
      sorted.sort((a, b) => a.days_until_stockout - b.days_until_stockout)
    }
    return sorted
  }

  const Counter = ({ value, suffix = '' }) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
      const timer = setTimeout(() => setCount(value), 100)
      return () => clearTimeout(timer)
    }, [value])
    return <span>{count}{suffix}</span>
  }

  const statCards = data ? [
    { key: 'critical', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critical Stock', value: data.summary.critical_stock },
    { key: 'low', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Low Stock', value: data.summary.low_stock },
    { key: 'overstock', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Overstock', value: data.summary.overstock },
    { key: 'healthy', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Healthy', value: data.summary.healthy_stock }
  ] : []

  const urgencyBadge = (urgency) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-gray-900'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[urgency]}`}>{urgency}</span>
  }

  const actionBadge = (action) => {
    const colors = {
      discount: 'bg-pink-500 text-white',
      bundle: 'bg-purple-500 text-white',
      return_to_supplier: 'bg-gray-500 text-white'
    }
    const labels = { discount: 'Discount', bundle: 'Bundle', return_to_supplier: 'Return' }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[action]}`}>{labels[action]}</span>
  }

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-pink-500" />
            AI Inventory Insights
          </h1>
          <p className="text-gray-600 mt-1">Smart recommendations for inventory optimization</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {statCards.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => scrollToSection(card.key)}
              className={`cursor-pointer transform transition-all ${selectedCard === card.key ? 'scale-105 ring-2 ring-pink-500' : 'hover:scale-102'}`}
            >
              <GlassCard className={`p-6 ${card.bg} ${card.border} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className={`text-3xl font-bold ${card.color} mt-1`}>
                      <Counter value={card.value} />
                    </p>
                  </div>
                  <card.icon className={`w-10 h-10 ${card.color}`} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reorder Recommendations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-pink-500" />
              Reorder Recommendations
            </h2>
            <div className="flex gap-2">
              {['urgency', 'days'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${sortBy === opt ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Sort by {opt === 'days' ? 'Days Left' : 'Urgency'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Urgency', 'Product', 'Stock', 'Days Left', 'Order Qty', 'Cost (KSH)', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getSortedRecommendations().map((item, i) => (
                  <motion.tr
                    key={item.product_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{urgencyBadge(item.urgency)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.current_stock <= item.reorder_level ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((item.current_stock / item.reorder_level) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.current_stock}/{item.reorder_level}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${item.days_until_stockout <= 7 ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.days_until_stockout} days
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.recommended_order_qty}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatKSH(item.estimated_cost_ksh)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCreatePO(item)}
                        className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                      >
                        Create PO
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {getSortedRecommendations().length === 0 && (
              <p className="text-center py-8 text-gray-500">No reorder recommendations at this time</p>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Advanced Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Distribution Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" />
              Inventory Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statCards.map(card => ({ name: card.label, value: card.value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statCards.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Performance Trend Line Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Performance Trend
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data?.performance_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="inventory_health" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Health Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Category Performance Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              Category Performance
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={data?.category_performance || []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar
                  name="Sales"
                  dataKey="sales_score"
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Inventory"
                  dataKey="inventory_score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </div>

      {/* Fast & Slow Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fast Movers */}
        <motion.div ref={sectionRefs.critical} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              Fast Movers
            </h2>
            {data?.fast_movers?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.fast_movers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="product_name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [value, 'Units Sold']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="units_sold_last_30_days" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-gray-500">No fast movers detected</p>
            )}
          </GlassCard>
        </motion.div>

        {/* Slow Movers */}
        <motion.div ref={sectionRefs.overstock} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }}>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-gray-500" />
              Slow Movers
            </h2>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {data?.slow_movers?.map((item, i) => (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.stock_quantity} units • {item.days_since_last_sale} days since sale</p>
                  </div>
                  {actionBadge(item.suggested_action)}
                </motion.div>
              ))}
              {data?.slow_movers?.length === 0 && (
                <p className="text-center py-8 text-gray-500">No slow movers detected</p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Monthly Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">6-Month Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data?.monthly_trend || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => `KSh ${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue_ksh') return [formatKSH(value), 'Revenue']
                  return [value, name === 'units_sold' ? 'Units Sold' : 'Orders']
                }}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="revenue_ksh"
                stroke="#ec4899"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default DSSDashboard
