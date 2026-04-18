import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  LineChart, Line, BarChart, Bar, ComposedChart, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Area, ReferenceLine, Cell
} from 'recharts'
import { 
  TrendingUp, PieChart, Calculator, AlertCircle, Brain, 
  Target, Package, ArrowRight, RefreshCw, Info, CheckCircle,
  AlertTriangle, ChevronRight, Settings
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import { dealerAPI } from '../../services/apiClient'

const COLORS = {
  A: '#10b981', // emerald
  B: '#f59e0b', // amber
  C: '#ef4444', // red
  forecast: '#8b5cf6',
  actual: '#06b6d4',
  confidence: '#ec4899'
}

const DealerAnalytics = () => {
  const [activeTab, setActiveTab] = useState('forecast')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  
  // Forecast state
  const [selectedForecastProduct, setSelectedForecastProduct] = useState('')
  const [forecastData, setForecastData] = useState(null)
  
  // ABC Analysis state
  const [abcData, setAbcData] = useState(null)
  
  // EOQ state
  const [selectedEOQProduct, setSelectedEOQProduct] = useState('')
  const [eoqParams, setEoqParams] = useState({
    ordering_cost: 500,
    holding_cost_percent: 20,
    lead_time: 7,
    safety_days: 3
  })
  const [eoqData, setEoqData] = useState(null)
  
  // Reorder recommendations state
  const [reorderData, setReorderData] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchABCAnalysis()
    fetchReorderRecommendations()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await dealerAPI.getProducts()
      setProducts(res.data?.results || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const fetchForecast = async () => {
    if (!selectedForecastProduct) return
    try {
      setLoading(true)
      const res = await dealerAPI.getDemandForecast(selectedForecastProduct)
      setForecastData(res.data)
    } catch (err) {
      console.error('Failed to load forecast:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchABCAnalysis = async () => {
    try {
      setLoading(true)
      const res = await dealerAPI.getABCAnalysis()
      setAbcData(res.data)
    } catch (err) {
      console.error('Failed to load ABC analysis:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEOQ = async () => {
    if (!selectedEOQProduct) return
    try {
      setLoading(true)
      const res = await dealerAPI.getEOQ(selectedEOQProduct, eoqParams)
      setEoqData(res.data)
    } catch (err) {
      console.error('Failed to load EOQ:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReorderRecommendations = async () => {
    try {
      setLoading(true)
      const res = await dealerAPI.getReorderRecommendations()
      setReorderData(res.data)
    } catch (err) {
      console.error('Failed to load reorder recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const tabs = [
    { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp },
    { id: 'abc', label: 'ABC Analysis', icon: PieChart },
    { id: 'eoq', label: 'EOQ Calculator', icon: Calculator },
    { id: 'reorder', label: 'Reorder Recommendations', icon: AlertCircle },
  ]

  // Prepare forecast chart data
  const prepareForecastChartData = () => {
    if (!forecastData) return []
    
    const historical = forecastData.historical_data?.map(d => ({
      date: d.date,
      actual: d.actual,
      forecast: d.forecast,
      lower: d.lower,
      upper: d.upper,
      type: 'historical'
    })) || []
    
    const future = forecastData.future_forecast?.map(d => ({
      date: d.date,
      forecast: d.forecast,
      lower: d.lower,
      upper: d.upper,
      type: 'forecast'
    })) || []
    
    return [...historical, ...future]
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Decision Support System
          </h1>
          <p className="text-slate-600 mt-1">Advanced analytics and inventory optimization tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Demand Forecast */}
      {activeTab === 'forecast' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Demand Forecast
                </h2>
                <p className="text-slate-600 text-sm mt-1">Simple exponential smoothing (α = 0.3) with 30-day prediction</p>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedForecastProduct}
                  onChange={(e) => setSelectedForecastProduct(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-gray-800">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-800">{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={fetchForecast}
                  disabled={!selectedForecastProduct || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  Generate Forecast
                </button>
              </div>
            </div>
            
            {forecastData ? (
              <>
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{forecastData.product_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm">Historical Period</p>
                      <p className="text-slate-900 font-medium">90 days</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Forecast Period</p>
                      <p className="text-slate-900 font-medium">30 days</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Alpha (Smoothing)</p>
                      <p className="text-slate-900 font-medium">{forecastData.alpha}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Confidence</p>
                      <p className="text-slate-900 font-medium">±20%</p>
                    </div>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareForecastChartData()}>
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
                        formatter={(value, name) => [value, name]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-KE')}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="upper" 
                        stroke="transparent" 
                        fill={COLORS.confidence} 
                        fillOpacity={0.1}
                        name="Upper Bound"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lower" 
                        stroke="transparent" 
                        fill="#1f2937"
                        fillOpacity={1}
                        name="Lower Bound"
                      />
                      <Line type="monotone" dataKey="actual" stroke={COLORS.actual} strokeWidth={2} dot={false} name="Actual Sales" />
                      <Line type="monotone" dataKey="forecast" stroke={COLORS.forecast} strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a product to generate demand forecast</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* ABC Analysis */}
      {activeTab === 'abc' && abcData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              ABC Analysis (Pareto Chart)
            </h2>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={abcData.abc_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="product_name" 
                    stroke="#9ca3af"
                    tick={false}
                  />
                  <YAxis yAxisId="left" stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales_value" name="Sales Value" fill="#8b5cf6">
                    {abcData.abc_data?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.classification]} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumulative_percentage" name="Cumulative %" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <ReferenceLine yAxisId="right" y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: '80%', fill: '#10b981' }} />
                  <ReferenceLine yAxisId="right" y={95} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '95%', fill: '#f59e0b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-400">{abcData.summary?.a_count}</p>
                <p className="text-sm text-slate-600">A Items (80%)</p>
                <p className="text-xs text-emerald-500">{formatKSH(abcData.summary?.a_value)}</p>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-400">{abcData.summary?.b_count}</p>
                <p className="text-sm text-slate-600">B Items (15%)</p>
                <p className="text-xs text-amber-500">{formatKSH(abcData.summary?.b_value)}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-400">{abcData.summary?.c_count}</p>
                <p className="text-sm text-slate-600">C Items (5%)</p>
                <p className="text-xs text-red-500">{formatKSH(abcData.summary?.c_value)}</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Classification Details</h2>
            
            <div className="overflow-y-auto max-h-96">
              <table className="w-full">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-700 text-sm">Product</th>
                    <th className="px-3 py-2 text-center text-slate-700 text-sm">Class</th>
                    <th className="px-3 py-2 text-right text-slate-700 text-sm">Value</th>
                    <th className="px-3 py-2 text-right text-slate-700 text-sm">Cum %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {abcData.abc_data?.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-900 text-sm">{item.product_name}</td>
                      <td className="px-3 py-2 text-center">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ 
                            backgroundColor: `${COLORS[item.classification]}20`,
                            color: COLORS[item.classification]
                          }}
                        >
                          {item.classification}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 text-sm">{formatKSH(item.sales_value)}</td>
                      <td className="px-3 py-2 text-right text-slate-600 text-sm">{item.cumulative_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* EOQ Calculator */}
      {activeTab === 'eoq' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-cyan-500" />
                  EOQ Calculator
                </h2>
                <p className="text-slate-600 text-sm mt-1">Economic Order Quantity optimization</p>
              </div>
              
              <button
                onClick={() => setEoqParams({ ordering_cost: 500, holding_cost_percent: 20, lead_time: 7, safety_days: 3 })}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Defaults
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Product Selection */}
              <div>
                <label className="block text-slate-600 text-sm mb-2">Select Product</label>
                <select
                  value={selectedEOQProduct}
                  onChange={(e) => setSelectedEOQProduct(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="" className="bg-gray-800">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-800">{p.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Parameters */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 text-sm mb-1">Ordering Cost (KES)</label>
                  <input
                    type="number"
                    value={eoqParams.ordering_cost}
                    onChange={(e) => setEoqParams({...eoqParams, ordering_cost: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm mb-1">Holding Cost (% annually)</label>
                  <input
                    type="number"
                    value={eoqParams.holding_cost_percent}
                    onChange={(e) => setEoqParams({...eoqParams, holding_cost_percent: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 text-sm mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    value={eoqParams.lead_time}
                    onChange={(e) => setEoqParams({...eoqParams, lead_time: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm mb-1">Safety Stock (days)</label>
                  <input
                    type="number"
                    value={eoqParams.safety_days}
                    onChange={(e) => setEoqParams({...eoqParams, safety_days: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={fetchEOQ}
                  disabled={!selectedEOQProduct || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  Calculate EOQ
                </button>
              </div>
            </div>
            
            {eoqData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Main Results */}
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-4 rounded-lg">
                  <p className="text-cyan-400 text-sm mb-1">Optimal Order Quantity (EOQ)</p>
                  <p className="text-3xl font-bold text-slate-900">{Math.round(eoqData.eoq).toLocaleString()} <span className="text-lg">units</span></p>
                  <p className="text-slate-600 text-xs mt-2">Based on annual demand of {eoqData.annual_demand} units</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-lg">
                  <p className="text-purple-400 text-sm mb-1">Reorder Point</p>
                  <p className="text-3xl font-bold text-slate-900">{Math.round(eoqData.reorder_point).toLocaleString()} <span className="text-lg">units</span></p>
                  <p className="text-slate-600 text-xs mt-2">When stock reaches this level, reorder</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-4 rounded-lg">
                  <p className="text-emerald-400 text-sm mb-1">Safety Stock</p>
                  <p className="text-3xl font-bold text-slate-900">{Math.round(eoqData.safety_stock).toLocaleString()} <span className="text-lg">units</span></p>
                  <p className="text-slate-600 text-xs mt-2">Buffer for demand variability</p>
                </div>
                
                {/* Cost Breakdown */}
                <GlassCard className="p-4 md:col-span-3 bg-white border border-slate-200">
                  <h3 className="text-lg font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Cost Analysis
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm">Unit Cost</p>
                      <p className="text-slate-900 font-medium">{formatKSH(eoqData.costs?.unit_cost)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Annual Ordering Cost</p>
                      <p className="text-slate-900 font-medium">{formatKSH(eoqData.costs?.annual_ordering_cost)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Annual Holding Cost</p>
                      <p className="text-slate-900 font-medium">{formatKSH(eoqData.costs?.annual_holding_cost)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Total Annual Cost</p>
                      <p className="text-cyan-400 font-bold">{formatKSH(eoqData.costs?.total_annual_cost)}</p>
                    </div>
                  </div>
                </GlassCard>
                
                {/* Formula Explanation */}
                <div className="bg-slate-50 p-4 rounded-lg md:col-span-3 border border-slate-200">
                  <p className="text-slate-600 text-sm mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Formula Used
                  </p>
                  <code className="text-cyan-400 text-sm">
                    EOQ = √((2 × {eoqData.annual_demand} × {eoqData.costs?.ordering_cost}) / ({eoqData.costs?.holding_cost_percent}% × {formatKSH(eoqData.costs?.unit_cost)})) = {Math.round(eoqData.eoq)} units
                  </code>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Reorder Recommendations */}
      {activeTab === 'reorder' && reorderData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-4 bg-white/95 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Reorder Recommendations
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {reorderData.critical_count > 0 && (
                    <span className="text-red-400">{reorderData.critical_count} critical, </span>
                  )}
                  {reorderData.high_count > 0 && (
                    <span className="text-amber-400">{reorderData.high_count} high priority, </span>
                  )}
                  {reorderData.medium_count} medium priority items
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-slate-600 text-sm">Total Suggested Order Value</p>
                  <p className="text-xl font-bold text-slate-900">{formatKSH(reorderData.total_suggested_value)}</p>
                </div>
                <button
                  onClick={fetchReorderRecommendations}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            
            {reorderData.recommendations?.length > 0 ? (
              <div className="space-y-3">
                {reorderData.recommendations.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      item.urgency === 'Critical' ? 'bg-red-500/10 border-red-500' :
                      item.urgency === 'High' ? 'bg-amber-500/10 border-amber-500' :
                      'bg-yellow-500/10 border-yellow-500'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-slate-900">{item.product_name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            item.urgency === 'Critical' ? 'bg-red-500 text-white' :
                            item.urgency === 'High' ? 'bg-amber-500 text-white' :
                            'bg-yellow-500 text-gray-900'
                          }`}>
                            {item.urgency}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-slate-600">Current: <span className="text-slate-900">{item.current_stock} units</span></span>
                          <span className="text-slate-600">Reorder Level: <span className="text-slate-900">{item.reorder_level} units</span></span>
                          <span className="text-slate-600">Suggested: <span className="text-emerald-700 font-medium">{item.suggested_order_quantity} units</span></span>
                          <span className="text-slate-600">Est. Value: <span className="text-slate-900">{formatKSH(item.estimated_order_value)}</span></span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          to={`/dealer/products?edit=${item.product_id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Restock
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    
                    {item.supplier_email && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-slate-600">
                          Supplier: <a href={`mailto:${item.supplier_email}`} className="text-cyan-400 hover:underline">{item.supplier_email}</a>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p className="text-slate-900 font-medium">All inventory levels are healthy!</p>
                <p className="text-slate-600 text-sm">No products require reordering at this time.</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}

export default DealerAnalytics
