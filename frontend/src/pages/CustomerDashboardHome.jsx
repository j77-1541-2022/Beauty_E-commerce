import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Package,
  Heart,
  Zap,
  RotateCw,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  ArrowRight,
  ShoppingBag,
  LogOut
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useWishlist } from '../contexts/WishlistContext'
import CustomerDashboardLayout from '../components/layouts/CustomerDashboardLayout'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import LoadingSpinner from '../components/LoadingSpinner'
import { customerAPI } from '../services/customerAPI'
import { orderAPI } from '../services/apiClient'
import LoyaltyProgressBar from '../components/LoyaltyProgressBar'

const CustomerDashboardHome = () => {
  const { user, logout } = useCustomerAuth()
  const { isDark, currentTheme, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const { getWishlistCount, wishlistItems } = useWishlist()
  const navigate = window.location

  const [metrics, setMetrics] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [wishlistPreview, setWishlistPreview] = useState([])
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reorderingId, setReorderingId] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch orders
      const ordersRes = await orderAPI.getCustomerOrders()
      const orders = ordersRes.results || ordersRes || []

      // Get recent orders (last 3 delivered)
      const recentDelivered = orders
        .filter(o => o.status === 'delivered')
        .slice(0, 3)

      setRecentOrders(orders.slice(0, 5))

      // Calculate metrics
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      const loyaltyPoints = user?.loyalty_points || 0

      setMetrics({
        totalOrders,
        totalSpent,
        loyaltyPoints,
        memberTier: getMemberTier(loyaltyPoints),
        wishlistCount: getWishlistCount()
      })

      // Get wishlist preview (top 3)
      if (wishlistItems && wishlistItems.length > 0) {
        setWishlistPreview(wishlistItems.slice(0, 3))
      }

      // Calculate loyalty progress
      setLoyaltyData({
        currentPoints: loyaltyPoints,
        nextTierPoints: Math.ceil(loyaltyPoints / 1000) * 1000 + 1000,
        progressPercent: (loyaltyPoints % 1000) / 1000 * 100
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMemberTier = (points) => {
    if (points < 1000) return 'Bronze'
    if (points < 5000) return 'Silver'
    if (points < 10000) return 'Gold'
    return 'Platinum'
  }

  const handleReorder = async (orderId) => {
    try {
      setReorderingId(orderId)
      const response = await orderAPI.reorder(orderId)
      
      if (response.ok || response.cart_items_count > 0) {
        alert(`${response.cart_items_count || 'All'} items added to your cart!`)
        // Refresh orders
        fetchDashboardData()
      }
    } catch (error) {
      alert('Failed to reorder. Please try again.')
      console.error('Reorder error:', error)
    } finally {
      setReorderingId(null)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <CustomerDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </CustomerDashboardLayout>
    )
  }

  return (
    <CustomerDashboardLayout>
      <div className={`min-h-screen ${currentTheme.background} p-6`}>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${currentTheme.text} mb-2`}>
                Welcome back, {user?.first_name || 'Customer'}! 👋
              </h1>
              <p className={currentTheme.textMuted}>
                Manage your orders, wishlist, and loyalty rewards all in one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className={`px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center gap-2`}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
              <button
                onClick={() => window.location.href = '/shop'}
                className={`px-6 py-3 ${currentTheme.button} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <ShoppingBag className="w-5 h-5" />
                Go to Shop
              </button>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <Package className={`w-8 h-8 ${currentTheme.accent}`} />
                  <span className={`text-sm font-medium ${currentTheme.textMuted}`}>This Month</span>
                </div>
                <h3 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>
                  {metrics.totalOrders}
                </h3>
                <p className={currentTheme.textMuted}>Total Orders</p>
              </GlassCard>
            </motion.div>

            {/* Total Spent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className={`w-8 h-8 ${currentTheme.accent}`} />
                  <span className={`text-sm font-medium ${currentTheme.textMuted}`}>Total</span>
                </div>
                <h3 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>
                  {formatPrice(metrics.totalSpent)}
                </h3>
                <p className={currentTheme.textMuted}>Amount Spent</p>
              </GlassCard>
            </motion.div>

            {/* Loyalty Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <Zap className={`w-8 h-8 ${currentTheme.accent}`} />
                  <span className={`text-sm font-medium ${currentTheme.textMuted}`}>Loyalty</span>
                </div>
                <h3 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>
                  {metrics.loyaltyPoints}
                </h3>
                <p className={currentTheme.textMuted}>Loyalty Points</p>
              </GlassCard>
            </motion.div>

            {/* Member Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <Star className={`w-8 h-8 ${currentTheme.accent}`} />
                  <span className={`text-sm font-medium ${currentTheme.textMuted}`}>Status</span>
                </div>
                <h3 className={`text-3xl font-bold ${currentTheme.accent} mb-2`}>
                  {metrics.memberTier}
                </h3>
                <p className={currentTheme.textMuted}>Member Tier</p>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {/* Loyalty Progress Bar */}
        {loyaltyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <LoyaltyProgressBar
              currentPoints={loyaltyData.currentPoints}
              nextTierPoints={loyaltyData.nextTierPoints}
              progressPercent={loyaltyData.progressPercent}
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${currentTheme.text}`}>Recent Orders</h2>
                <button
                  onClick={() => window.location.href = '/orders'}
                  className={`flex items-center space-x-2 text-sm ${currentTheme.accent} hover:opacity-80 transition-opacity`}
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className={`p-4 rounded-lg ${currentTheme.secondary} border border-white/10 flex items-center justify-between`}
                    >
                      <div>
                        <p className={`font-semibold ${currentTheme.text}`}>Order #{order.id}</p>
                        <p className={`text-sm ${currentTheme.textMuted} flex items-center space-x-2`}>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-bold ${currentTheme.accent}`}>
                            {formatPrice(order.total)}
                          </p>
                          <p className={`text-xs ${currentTheme.textMuted} capitalize`}>
                            {order.status}
                          </p>
                        </div>
                        {order.status === 'delivered' && (
                          <AnimatedButton
                            onClick={() => handleReorder(order.id)}
                            disabled={reorderingId === order.id}
                            className="px-3 py-1 text-sm"
                            icon={<RotateCw className={`w-4 h-4 ${reorderingId === order.id ? 'animate-spin' : ''}`} />}
                          >
                            Reorder
                          </AnimatedButton>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className={`w-12 h-12 ${currentTheme.textMuted} mx-auto mb-4 opacity-50`} />
                  <p className={currentTheme.textMuted}>No orders yet</p>
                  <button
                    onClick={() => window.location.href = '/shop'}
                    className={`mt-4 px-4 py-2 ${currentTheme.button} text-white rounded-lg hover:opacity-90 transition-opacity`}
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Wishlist Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${currentTheme.text} flex items-center space-x-2`}>
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </h2>
                <span className={`text-sm font-medium ${currentTheme.accent}`}>
                  {metrics?.wishlistCount || 0} items
                </span>
              </div>

              {wishlistPreview.length > 0 ? (
                <div className="space-y-4">
                  {wishlistPreview.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className={`p-3 rounded-lg ${currentTheme.secondary} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <p className={`font-medium ${currentTheme.text} truncate`}>{item.name}</p>
                      <p className={`text-sm ${currentTheme.accent}`}>{formatPrice(item.price)}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className={`w-12 h-12 ${currentTheme.textMuted} mx-auto mb-4 opacity-50`} />
                  <p className={currentTheme.textMuted}>No items in wishlist</p>
                  <button
                    onClick={() => window.location.href = '/shop'}
                    className={`mt-4 px-4 py-2 ${currentTheme.button} text-white rounded-lg hover:opacity-90 transition-opacity`}
                  >
                    Add Items
                  </button>
                </div>
              )}

              <button
                onClick={() => window.location.href = '/wishlist'}
                className={`w-full mt-4 py-2 ${currentTheme.secondary} rounded-lg text-sm font-medium ${currentTheme.accent} hover:opacity-80 transition-opacity`}
              >
                View All
              </button>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </CustomerDashboardLayout>
  )
}

export default CustomerDashboardHome
