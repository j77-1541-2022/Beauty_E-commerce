import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingBag, Clock, TrendingUp, Wallet, Package, Mail, ChevronRight, AlertCircle, Wifi, WifiOff, RefreshCw, BarChart3, PieChart as PieIcon, Activity, Brain } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts'
import { GlassCard } from '../../components/ui/GlassCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'
import { dealerAPI, notificationAPI } from '../../services/apiClient'
import wsService from '../../services/websocketService'

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

const DealerDashboard = () => {
  const [data, setData] = useState(null)
  const [chartsData, setChartsData] = useState(null)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [realTimeUpdate, setRealTimeUpdate] = useState(null)
  const { showNotification } = useNotification()
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboard()
    fetchChartsData()
    fetchSupportTickets()
    setupWebSocket()
    
    return () => {
      cleanupWebSocket()
    }
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await dealerAPI.getDashboard()
      setData(res.data)
    } catch (err) {
      console.error('Failed to load dealer dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartsData = async () => {
    try {
      const res = await dealerAPI.getDashboardCharts()
      setChartsData(res.data)
    } catch (err) {
      console.error('Failed to load charts data:', err)
    } finally {
      setChartsLoading(false)
    }
  }

  const setupWebSocket = useCallback(() => {
    if (!user) return

    // Connect to dealer-specific channel
    wsService.connect('dealer', user.role, user.id)

    // Subscribe to connection status
    wsService.subscribe('connection', (status) => {
      setWsConnected(status.status === 'connected')
      if (status.status === 'connected') {
        showNotification('Real-time updates enabled', 'success')
      }
    })

    // Subscribe to dealer updates
    wsService.subscribeToDealerUpdates((update) => {
      console.log('Real-time update received:', update)
      
      // Show notification for important updates
      if (update.type === 'new_order') {
        showNotification(`New order received: #${update.order_number}`, 'success')
        setRealTimeUpdate({ type: 'order', data: update })
      } else if (update.type === 'low_stock_alert') {
        showNotification(`Low stock alert: ${update.product_name}`, 'warning')
        setRealTimeUpdate({ type: 'inventory', data: update })
      } else if (update.type === 'order_status_changed') {
        showNotification(`Order #${update.order_number} status: ${update.status}`, 'info')
      }

      // Refresh dashboard data on updates
      fetchDashboard()
    })
  }, [user, showNotification])

  const cleanupWebSocket = useCallback(() => {
    wsService.unsubscribeFromDealerUpdates()
    wsService.disconnect()
  }, [])

  const handleManualRefresh = () => {
    setLoading(true)
    setChartsLoading(true)
    fetchDashboard()
    fetchChartsData()
  }

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE')}`

  const stats = data?.stats || {}

  const statCards = [
    { icon: ShoppingBag, label: 'Total Orders', value: stats.total_orders || 0, color: 'from-blue-500 to-cyan-500' },
    { icon: Clock, label: 'Pending Orders', value: stats.pending_orders || 0, color: 'from-amber-500 to-orange-500' },
    { icon: TrendingUp, label: 'Revenue This Month', value: formatKSH(stats.total_revenue_ksh), color: 'from-emerald-500 to-teal-500' },
    { icon: Wallet, label: 'Pending Payout', value: formatKSH(stats.pending_payout_ksh), color: 'from-pink-500 to-rose-500' },
    { icon: Package, label: 'Products Listed', value: stats.products_listed || 0, color: 'from-purple-500 to-indigo-500' },
    { icon: TrendingUp, label: 'Sales Growth', value: `${stats.sales_growth_percent || 0}%`, color: 'from-green-500 to-emerald-500' },
  ]

  // Fetch dealer profile for account info
  const [profile, setProfile] = useState(null)
  const [emailEdit, setEmailEdit] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [supportSubmitting, setSupportSubmitting] = useState(false)
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'normal',
  })
  const [supportTickets, setSupportTickets] = useState([])
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(true)

  const fetchSupportTickets = async () => {
    setSupportTicketsLoading(true)
    try {
      const res = await notificationAPI.getDealerNotifications({ limit: 25 })
      const notifications = res?.data?.notifications || []

      const tickets = notifications
        .filter((item) => {
          const ref = item?.reference_id || ''
          const title = (item?.title || '').toLowerCase()
          return String(ref).startsWith('SUP-') || title.includes('support request')
        })
        .slice(0, 5)

      setSupportTickets(tickets)
    } catch (err) {
      console.error('Failed to load support tickets:', err)
      setSupportTickets([])
    } finally {
      setSupportTicketsLoading(false)
    }
  }

  useEffect(() => {
    dealerAPI.getProfile().then(res => {
      setProfile(res.data)
      setEmailInput(res.data.business_email || '')
    }).finally(() => setProfileLoading(false))
  }, [])

  const handleEmailSave = async () => {
    setProfileLoading(true)
    try {
      const res = await dealerAPI.updateProfile({ business_email: emailInput })
      setProfile(res.data)
      setEmailEdit(false)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSupportSubmit = async (event) => {
    event.preventDefault()

    if ((supportForm.subject || '').trim().length < 5) {
      showNotification('Please enter a subject with at least 5 characters.', 'warning')
      return
    }

    if ((supportForm.message || '').trim().length < 10) {
      showNotification('Please provide more details (at least 10 characters).', 'warning')
      return
    }

    setSupportSubmitting(true)
    try {
      const res = await dealerAPI.contactSupport(supportForm)
      const ticketId = res?.data?.ticket_id
      if (ticketId) {
        showNotification(`Support request submitted. Ticket: ${ticketId}`, 'success')
      } else {
        showNotification('Support request submitted successfully.', 'success')
      }
      setSupportModalOpen(false)
      setSupportForm({
        subject: '',
        message: '',
        category: 'general',
        priority: 'normal',
      })
      fetchSupportTickets()
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Failed to submit support request. Please try again.'
      showNotification(errorMessage, 'error')
    } finally {
      setSupportSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="dashboard" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WebSocket Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            wsConnected 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {wsConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline</span>
              </>
            )}
          </div>
          
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Update Notification */}
      <AnimatePresence>
        {realTimeUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl ${
              realTimeUpdate.type === 'order' 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {realTimeUpdate.type === 'order' ? (
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {realTimeUpdate.type === 'order' ? 'New Order Received' : 'Inventory Update'}
                </p>
                <p className="text-sm text-gray-600">
                  {realTimeUpdate.type === 'order' 
                    ? `Order #${realTimeUpdate.data.order_number} just arrived`
                    : `${realTimeUpdate.data.product_name} stock updated`
                  }
                </p>
              </div>
              <button
                onClick={() => setRealTimeUpdate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      {/* Inventory Intelligence Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <GlassCard className="p-5 flex flex-col justify-between hover:shadow-xl transition cursor-pointer" hover onClick={() => window.location.href='/dealer/inventory'}>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span className="font-semibold text-lg">Inventory</span>
          </div>
          <div className="text-sm text-gray-500 mb-2">View and adjust stock for all products</div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-amber-500 font-medium">Open Inventory</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex flex-col justify-between hover:shadow-xl transition cursor-pointer" hover onClick={() => window.location.href='/dealer/inventory-reports'}>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-pink-500" />
            <span className="font-semibold text-lg">Inventory Reports</span>
          </div>
          <div className="text-sm text-gray-500 mb-2">Stock, low stock, movement, valuation</div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-pink-500 font-medium">View Reports</span>
            <ChevronRight className="w-4 h-4 text-pink-400" />
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex flex-col justify-between hover:shadow-xl transition cursor-pointer" hover onClick={() => window.location.href='/dealer/analytics'}>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <span className="font-semibold text-lg">DSS Insights</span>
          </div>
          <div className="text-sm text-gray-500 mb-2">Forecast, ABC, EOQ, reorder</div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-purple-500 font-medium">View Insights</span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock by Category - Pie Chart */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Stock by Category</h2>
          </div>
          {chartsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <SkeletonLoader variant="card" />
            </div>
          ) : chartsData?.stock_by_category?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartsData.stock_by_category}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="stock_value"
                  nameKey="category"
                >
                  {chartsData.stock_by_category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value, name, props) => [
                    `${props.payload.product_count} products`,
                    props.payload.category
                  ]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No category data available</p>
            </div>
          )}
        </GlassCard>

        {/* Stock Movement Trend - Area Chart */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Stock Movement Trend</h2>
          </div>
          {chartsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <SkeletonLoader variant="card" />
            </div>
          ) : chartsData?.stock_movement?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartsData.stock_movement}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="total_quantity"
                  stroke="#ec4899"
                  fillOpacity={1}
                  fill="url(#colorStock)"
                  name="Stock Movement"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No movement data available</p>
            </div>
          )}
        </GlassCard>

        {/* Income vs Expenditure - Bar Chart */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Income vs Expenditure</h2>
          </div>
          {chartsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <SkeletonLoader variant="card" />
            </div>
          ) : chartsData?.income_vs_expenditure?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartsData.income_vs_expenditure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatKSH} tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={formatKSH} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenditure" fill="#ef4444" name="Expenditure" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No income/expenditure data available</p>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link to="/dealer/orders" className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {data?.recent_orders?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="pb-3">Order</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recent_orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">#{order.order_number}</td>
                        <td className="py-3 text-gray-600">{order.customer_name}</td>
                        <td className="py-3 font-medium">{formatKSH(order.amount)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No orders yet</p>
              </div>
            )}
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-5">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/dealer/orders"
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Update Order Status</p>
                  <p className="text-xs text-gray-500">Mark orders as shipped</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                to="/dealer/orders"
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">View All Orders</p>
                  <p className="text-xs text-gray-500">Check order history</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-xs text-gray-500">Get help from our team</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5 mt-4">
            <h2 className="text-lg font-semibold mb-4">Recent Support Tickets</h2>
            {supportTicketsLoading ? (
              <SkeletonLoader variant="card" />
            ) : supportTickets.length > 0 ? (
              <div className="space-y-3">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm">{ticket.reference_id || `Ticket #${ticket.id}`}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.is_read ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {ticket.is_read ? 'Seen' : 'New'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{ticket.title || 'Support request submitted'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No support tickets submitted yet.</p>
            )}
          </GlassCard>

          {data?.top_products?.length > 0 && (
            <GlassCard className="p-5 mt-4">
              <h2 className="text-lg font-semibold mb-4">Top Products</h2>
              <div className="space-y-3">
                {data.top_products.map((product, i) => (
                  <div key={product.product_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{product.product_name}</p>
                      <p className="text-xs text-gray-500">{product.total_sold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {data?.low_stock_alerts?.length > 0 && (
            <GlassCard className="p-5 mt-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Low Stock Alerts
              </h2>
              <div className="space-y-3">
                {data.low_stock_alerts.map((alert) => (
                  <div key={alert.product_id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{alert.product_name}</p>
                      <p className="text-xs text-gray-600">
                        Current: {alert.current_stock} | Reorder: {alert.reorder_level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-700">
                        Order {alert.suggested_order} more
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {data?.expiring_soon?.length > 0 && (
            <GlassCard className="p-5 mt-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Products Expiring Soon (≤ 3 months)
              </h2>
              <div className="space-y-3">
                {data.expiring_soon.map((product) => (
                  <div key={product.product_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.product_name}</p>
                      <p className="text-xs text-gray-600">
                        Expiry Date: {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-700">
                        {product.days_left} days left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Account Information Section */}
      <GlassCard className="p-5 mb-4">
        <h2 className="text-lg font-semibold mb-3">Account Information</h2>
        {profileLoading ? (
          <SkeletonLoader variant="card" />
        ) : profile && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Email:</span>
              {emailEdit ? (
                <>
                  <input
                    type="email"
                    className="form-input px-2 py-1 rounded border border-gray-300"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                  <button className="ml-2 text-emerald-600 font-medium" onClick={handleEmailSave}>Save</button>
                  <button className="ml-1 text-gray-400" onClick={() => setEmailEdit(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <span>{profile.business_email || <span className="italic text-gray-400">Not set</span>}</span>
                  <button className="ml-2 text-blue-600 font-medium" onClick={() => setEmailEdit(true)}>Edit</button>
                </>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-700">Commission Rate:</span>
              <span className="ml-2">{profile.commission_rate ? `${parseFloat(profile.commission_rate).toFixed(2)}%` : 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Member Since:</span>
              <span className="ml-2">{profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : 'Not verified'}</span>
            </div>
          </div>
        )}
      </GlassCard>

      <AnimatePresence>
        {supportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSupportModalOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900">Contact Support</h3>
              <p className="text-sm text-gray-500 mt-1">Submit a support request and our team will follow up.</p>

              <form className="space-y-4 mt-5" onSubmit={handleSupportSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Category</label>
                    <select
                      value={supportForm.category}
                      onChange={(e) => setSupportForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="general">General</option>
                      <option value="orders">Orders</option>
                      <option value="inventory">Inventory</option>
                      <option value="payments">Payments</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Priority</label>
                    <select
                      value={supportForm.priority}
                      onChange={(e) => setSupportForm((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Briefly describe your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Message</label>
                  <textarea
                    value={supportForm.message}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, message: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[120px]"
                    placeholder="Provide full details so support can help quickly"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DealerDashboard
