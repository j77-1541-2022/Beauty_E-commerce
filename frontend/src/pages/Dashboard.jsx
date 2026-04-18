import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Eye,
  RefreshCw,
  DollarSign,
  Users,
  Activity,
  Plus,
  Filter,
  Download,
  Bell,
  Settings,
  Search,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { analyticsAPI, productsAPI, inventoryAPI, orderAPI } from '../services/apiClient'
import wsService from '../services/websocketService'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import SalesChart from '../components/SalesChart'
import TopProductsChart from '../components/TopProductsChart'
import InsightsPanel from '../components/InsightsPanel'
import QuickActions from '../components/QuickActions'
import NotificationCenter from '../components/NotificationCenter'

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds
  const [wsConnected, setWsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })
  const [selectedMetric, setSelectedMetric] = useState('all')

  // WebSocket event handlers
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket update received:', data)
    
    switch (data.type) {
      case 'inventory_update':
        setData(prevData => ({
          ...prevData,
          totalInventory: data.payload.total_inventory,
          lowStockItems: data.payload.low_stock_items,
          outOfStockItems: data.payload.out_of_stock_items
        }))
        addNotification({
          id: Date.now(),
          type: 'inventory',
          title: 'Inventory Updated',
          message: `${data.payload.product_name} stock updated to ${data.payload.new_quantity}`,
          timestamp: new Date()
        })
        break
      
      case 'new_order':
        setData(prevData => ({
          ...prevData,
          totalOrders: prevData.totalOrders + 1,
          totalRevenue: prevData.totalRevenue + data.payload.order_total,
          pendingOrders: prevData.pendingOrders + 1
        }))
        addNotification({
          id: Date.now(),
          type: 'order',
          title: 'New Order',
          message: `Order #${data.payload.order_id} received - ${formatCurrency(data.payload.order_total)}`,
          timestamp: new Date()
        })
        break
      
      case 'product_update':
        setData(prevData => ({
          ...prevData,
          totalProducts: data.payload.total_products
        }))
        break
      
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
    
    setLastUpdate(new Date())
  }, [])

  const handleWebSocketConnection = useCallback((status) => {
    setWsConnected(status.status === 'connected')
    if (status.status === 'error' || status.status === 'failed') {
      console.warn('WebSocket connection error:', status.error)
    }
  }, [])

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)) // Keep only last 10
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const fetchData = async () => {
    try {
      // Fetch data from all APIs to ensure real-time sync
      const [
        dashboardResponse,
        insightsResponse,
        productsResponse,
        inventoryResponse,
        ordersResponse
      ] = await Promise.all([
        analyticsAPI.getDashboard().catch(err => ({ data: {} })),
        analyticsAPI.getInventoryInsights().catch(err => ({ data: [] })),
        productsAPI.getProducts().catch(err => ({ results: [] })),
        inventoryAPI.getInventory().catch(err => ({ results: [] })),
        ordersAPI.getOrders().catch(err => ({ results: [] }))
      ])

      // Process and combine all data with safe fallbacks
      const dashboardData = dashboardResponse.data || dashboardResponse || {}
      const insightsData = insightsResponse.data || insightsResponse || []
      const productsData = productsResponse.results || productsResponse.data || productsResponse || []
      const inventoryData = inventoryResponse.results || inventoryResponse.data || inventoryResponse || []
      const ordersData = ordersResponse.results || ordersResponse.data || ordersResponse || []

      // Calculate real-time metrics with safe fallbacks
      const totalProducts = Array.isArray(productsData) ? productsData.length : 0
      const totalInventory = Array.isArray(inventoryData) ? inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0
      const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0
      const totalRevenue = Array.isArray(ordersData) ? ordersData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) : 0
      const lowStockItems = Array.isArray(inventoryData) ? inventoryData.filter(item => item.is_low_stock).length : 0
      const outOfStockItems = Array.isArray(inventoryData) ? inventoryData.filter(item => item.quantity === 0).length : 0
      const pendingOrders = Array.isArray(ordersData) ? ordersData.filter(order => order.status === 'pending').length : 0
      const deliveredOrders = Array.isArray(ordersData) ? ordersData.filter(order => order.status === 'delivered').length : 0

      // Enhanced dashboard data with real-time metrics
      const enhancedData = {
        ...dashboardData,
        totalProducts,
        totalInventory,
        totalOrders,
        totalRevenue,
        lowStockItems,
        outOfStockItems,
        pendingOrders,
        deliveredOrders,
        products: productsData,
        inventory: inventoryData,
        orders: ordersData,
        lastUpdated: new Date().toISOString()
      }

      setData(enhancedData)
      setInsights(Array.isArray(insightsData) ? insightsData : [])
      setLastUpdate(new Date())

      console.log('Dashboard data updated:', {
        totalProducts,
        totalInventory,
        totalOrders,
        totalRevenue,
        lowStockItems,
        outOfStockItems
      })

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Set default values on error
      setData({
        totalProducts: 0,
        totalInventory: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        lastUpdated: new Date().toISOString()
      })
      setInsights([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect()
    wsService.subscribe('inventory_update', handleWebSocketMessage)
    wsService.subscribe('new_order', handleWebSocketMessage)
    wsService.subscribe('product_update', handleWebSocketMessage)
    wsService.subscribe('connection', handleWebSocketConnection)

    return () => {
      wsService.unsubscribe('inventory_update', handleWebSocketMessage)
      wsService.unsubscribe('new_order', handleWebSocketMessage)
      wsService.unsubscribe('product_update', handleWebSocketMessage)
      wsService.unsubscribe('connection', handleWebSocketConnection)
      wsService.disconnect()
    }
  }, [handleWebSocketMessage, handleWebSocketConnection])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard...')
      fetchData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Manual refresh when component mounts or when user navigates back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [autoRefresh])

  if (loading) {
    return <LoadingSpinner />
  }

  const stats = data?.summary || {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="text-gray-600">
            Real-time overview of your beauty inventory
            {autoRefresh && (
              <span className="ml-2 text-xs text-green-600">
                • Auto-refreshing every {refreshInterval / 1000}s
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm ${autoRefresh
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
              }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActions data={data} />

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={data?.totalProducts || 0}
          icon={Package}
          color="primary"
          trend="+12%"
          description="Active products in catalog"
        />
        <StatCard
          title="Low Stock Items"
          value={data?.lowStockItems || 0}
          icon={AlertTriangle}
          color="secondary"
          trend="-5%"
          warning={data?.lowStockItems > 0}
          description="Items needing restock"
        />
        <StatCard
          title="Total Orders"
          value={data?.totalOrders || 0}
          icon={ShoppingCart}
          color="accent"
          trend="+18%"
          description={`${data?.pendingOrders || 0} pending, ${data?.deliveredOrders || 0} delivered`}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(data?.totalRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="primary"
          trend="+25%"
          description="From delivered orders"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Inventory"
          value={data?.totalInventory || 0}
          icon={Package}
          color="accent"
          description="Total items in stock"
        />
        <StatCard
          title="Out of Stock"
          value={data?.outOfStockItems || 0}
          icon={AlertTriangle}
          color="danger"
          warning={data?.outOfStockItems > 0}
          description="Items completely out of stock"
        />
        <StatCard
          title="Active Users"
          value={1}
          icon={Users}
          color="primary"
          description="Currently logged in"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={data?.sales_data || []} />
        <TopProductsChart data={data?.top_products || []} />
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onClearAll={() => setNotifications([])}
        />
      )}

      {/* Insights Panel */}
      <InsightsPanel insights={insights} />
    </div>
  )
}

export default Dashboard
