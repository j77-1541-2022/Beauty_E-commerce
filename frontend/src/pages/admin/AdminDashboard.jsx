import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Users, Package, TrendingUp,
  DollarSign, AlertTriangle, BarChart3, PieChart as PieChartIcon,
  X, ChevronRight, ArrowLeft, Calendar, Filter, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area
} from 'recharts';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { analyticsAPI, orderAPI, productAPI } from '../../services/apiClient';
import websocketService from '../../services/websocketService';
import './AdminDashboard.css';

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('line');
  const [drillDownView, setDrillDownView] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [dateRange, setDateRange] = useState('7d');
  const [wsConnected, setWsConnected] = useState(false);
  const [liveOrders, setLiveOrders] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', latency: 0 });
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    fetchDashboardData();

    // Initialize WebSocket for real-time monitoring
    const initWebSocket = () => {
      websocketService.connect('admin-dashboard');
      

      websocketService.subscribe('connection', (status) => {
        if (status.status === 'connected') {
          setWsConnected(true);
          setSystemHealth(prev => ({ ...prev, status: 'healthy' }));
        } else if (status.status === 'disconnected') {
          setWsConnected(false);
          setSystemHealth(prev => ({ ...prev, status: 'degraded' }));
        }
      });

      websocketService.subscribe('new_order', (data) => {
        setLiveOrders(prev => [data, ...prev.slice(0, 9)]);
        setRecentOrders(prev => [data, ...prev.slice(0, 4)]);
      });

      websocketService.subscribe('user_activity', (data) => {
        setActiveUsers(data.count || 0);
      });

      websocketService.subscribe('system_health', (data) => {
        setSystemHealth(data);
      });

      // Simulate real-time data for demo purposes
      const interval = setInterval(() => {
        setActiveUsers(prev => Math.max(0, prev + Math.floor(Math.random() * 5) - 2));
        setSystemHealth(prev => ({
          ...prev,
          latency: Math.floor(Math.random() * 100) + 20
        }));
      }, 5000);

      return () => {
        clearInterval(interval);
        websocketService.disconnect();
      };
    };

    const cleanup = initWebSocket();
    return cleanup;
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, ordersRes, productsRes] = await Promise.all([
        analyticsAPI.getOverview(),
        orderAPI.getAll({ limit: 5 }),
        productAPI.getAll({ limit: 5, ordering: '-sales_count' }),
      ]);

      setStats(overviewRes.data);
      setRecentOrders(ordersRes.data.results || []);
      setTopProducts(productsRes.data.results || []);

      // Generate sample sales data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          orders: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 50000) + 10000,
          customers: Math.floor(Math.random() * 30) + 5
        };
      });
      setSalesData(last7Days);

      // Generate category distribution data
      const categories = [
        { name: 'Skincare', value: 35, color: '#ec4899' },
        { name: 'Makeup', value: 25, color: '#8b5cf6' },
        { name: 'Hair Care', value: 20, color: '#06b6d4' },
        { name: 'Fragrance', value: 12, color: '#10b981' },
        { name: 'Tools', value: 8, color: '#f59e0b' }
      ];
      setCategoryData(categories);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatKES = (val) => `KES ${val?.toLocaleString('en-KE')}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? formatKES(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: stats?.total_revenue || 'KES 0', 
      change: '+12.5%', 
      icon: DollarSign,
      color: 'primary',
      drillDown: 'revenue'
    },
    { 
      title: 'Orders', 
      value: stats?.total_orders || '0', 
      change: '+8.2%', 
      icon: ShoppingBag,
      color: 'success',
      drillDown: 'orders'
    },
    { 
      title: 'Customers', 
      value: stats?.total_customers || '0', 
      change: '+15.3%', 
      icon: Users,
      color: 'info',
      drillDown: 'customers'
    },
    { 
      title: 'Products', 
      value: stats?.total_products || '0', 
      change: '+5.1%', 
      icon: Package,
      color: 'warning',
      drillDown: 'products'
    },
  ];

  const handleDrillDown = (type) => {
    setDrillDownView(type);
    // Generate detailed data based on type
    const detailedData = generateDetailedData(type);
    setDrillDownData(detailedData);
  };

  const generateDetailedData = (type) => {
    const ranges = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = ranges[dateRange] || 7;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 1000) + 500,
        orders: Math.floor(Math.random() * 50) + 10,
        customers: Math.floor(Math.random() * 30) + 5,
        growth: (Math.random() * 20 - 10).toFixed(1)
      };
    });
  };

  const closeDrillDown = () => {
    setDrillDownView(null);
    setDrillDownData(null);
  };

  const orderColumns = [
    { key: 'order_number', title: 'Order' },
    { key: 'customer_name', title: 'Customer' },
    { key: 'total_amount', title: 'Total', render: (v) => `KES ${v}` },
    { key: 'status', title: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-dashboard">
          <div className="stats-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <LoadingSkeleton key={i} variant="card" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleDrillDown(stat.drillDown)}
              className="cursor-pointer"
            >
              <GlassCard className={`stat-card stat-card--${stat.color} hover:shadow-lg transition-shadow`}>
                <div className="stat-icon">
                  <stat.icon size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-title">{stat.title}</span>
                  <span className="stat-change">{stat.change} from last month</span>
                  <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    Click to explore <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Real-Time Monitoring Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    {wsConnected ? 'Live Connection' : 'Disconnected'}
                  </span>
                </div>
                
                {/* Active Users */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{activeUsers}</span> Active Users
                  </span>
                </div>
                
                {/* System Latency */}
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">
                    Latency: <span className="font-semibold text-gray-900">{systemHealth.latency}ms</span>
                  </span>
                </div>
                
                {/* System Status */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    systemHealth.status === 'healthy' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {systemHealth.status === 'healthy' ? 'System Healthy' : 'Degraded'}
                  </span>
                </div>
              </div>
              
              {/* Live Activity Feed */}
              {liveOrders.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Latest Activity:</span>
                  <motion.span
                    key={liveOrders[0]?.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-medium text-pink-600"
                  >
                    New order #{liveOrders[0]?.order_number || liveOrders[0]?.id}
                  </motion.span>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Sales Trends Chart */}
          <GlassCard className="dashboard-section">
            <div className="section-header">
              <h2>Sales Trends (Last 7 Days)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartType === 'line' 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <LineChart className="w-4 h-4 inline mr-1" />
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Bar
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(val) => `KES ${(val / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    stroke="#ec4899" 
                    fill="#ec4899" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    name="Orders" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              ) : (
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(val) => `KES ${(val / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </GlassCard>

          {/* Category Distribution */}
          <GlassCard className="dashboard-section">
            <div className="section-header">
              <h2>Category Distribution</h2>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Secondary Content Grid */}
        <div className="dashboard-grid">
          {/* Recent Orders */}
          <GlassCard className="dashboard-section">
            <div className="section-header">
              <h2>Recent Orders</h2>
              <a href="/admin/orders" className="view-all">View All</a>
            </div>
            <DataTable
              columns={orderColumns}
              data={recentOrders}
              emptyStateProps={{ 
                variant: 'orders',
                title: 'No recent orders',
                description: 'Orders will appear here when customers make purchases'
              }}
            />
          </GlassCard>

          {/* Top Products */}
          <GlassCard className="dashboard-section">
            <div className="section-header">
              <h2>Top Products</h2>
              <a href="/admin/products" className="view-all">View All</a>
            </div>
            <div className="top-products-list">
              {topProducts.map((product, index) => (
                <div key={product.id} className="top-product-item">
                  <span className="top-product-rank">#{index + 1}</span>
                  <img 
                    src={product.image || '/placeholder-product.png'} 
                    alt={product.name}
                    className="top-product-image"
                  />
                  <div className="top-product-info">
                    <span className="top-product-name">{product.name}</span>
                    <span className="top-product-sales">
                      {product.sales_count || 0} sold
                    </span>
                  </div>
                  <span className="top-product-revenue">
                    KES {product.revenue || 0}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Low Stock Alert */}
        {stats?.low_stock_count > 0 && (
          <GlassCard className="alert-card alert-card--warning">
            <AlertTriangle size={24} />
            <div>
              <h3>Low Stock Alert</h3>
              <p>{stats.low_stock_count} products are running low on inventory.</p>
            </div>
            <a href="/admin/inventory" className="alert-action">View Inventory</a>
          </GlassCard>
        )}

        {/* Drill-Down Modal */}
        <AnimatePresence>
          {drillDownView && drillDownData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeDrillDown}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeDrillDown}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 capitalize">
                        {drillDownView} Analytics
                      </h2>
                      <p className="text-sm text-gray-500">Detailed breakdown and trends</p>
                    </div>
                  </div>
                  <button
                    onClick={closeDrillDown}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2 p-4 bg-gray-50 border-b border-gray-100">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Time Range:</span>
                  {['7d', '30d', '90d'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setDrillDownData(generateDetailedData(drillDownView));
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        dateRange === range
                          ? 'bg-pink-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                    </button>
                  ))}
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <GlassCard className="p-4">
                      <p className="text-sm text-gray-500">Total {drillDownView}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {drillDownData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                      </p>
                    </GlassCard>
                    <GlassCard className="p-4">
                      <p className="text-sm text-gray-500">Average Daily</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(drillDownData.reduce((sum, d) => sum + d.value, 0) / drillDownData.length).toLocaleString()}
                      </p>
                    </GlassCard>
                    <GlassCard className="p-4">
                      <p className="text-sm text-gray-500">Growth Trend</p>
                      <p className={`text-2xl font-bold ${
                        drillDownData[drillDownData.length - 1]?.growth > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {drillDownData[drillDownData.length - 1]?.growth > 0 ? '+' : ''}
                        {drillDownData[drillDownData.length - 1]?.growth}%
                      </p>
                    </GlassCard>
                  </div>

                  {/* Detailed Chart */}
                  <GlassCard className="p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={drillDownData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#ec4899"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                          name={drillDownView}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </GlassCard>

                  {/* Data Table */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customers</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Growth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {drillDownData.slice().reverse().map((row, index) => (
                            <motion.tr
                              key={row.date}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">{row.date}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.value.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{row.orders}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{row.customers}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`font-medium ${
                                  parseFloat(row.growth) > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {parseFloat(row.growth) > 0 ? '+' : ''}{row.growth}%
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
