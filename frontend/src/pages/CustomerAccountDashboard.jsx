import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award,
  Bell,
  ChevronRight,
  Heart,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  User,
  X,
  Zap,
  RotateCw,
  Eye,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  Trash2,
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'
import { notificationAPI, orderAPI } from '../services/apiClient'
import LoadingSpinner from '../components/LoadingSpinner'
import LuxuryBackground from '../components/LuxuryBackground'

const CustomerAccountDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useCustomerAuth()
  const { currentTheme, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const { wishlistItems, getWishlistCount } = useWishlist()
  const { getCartCount, refreshCart } = useCart()
  const { showNotification } = useNotification()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reorderingOrderId, setReorderingOrderId] = useState(null)

  const [showToastMenu, setShowToastMenu] = useState(false)
  const [buttonsVisible, setButtonsVisible] = useState(true)

  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({ old: '', next: '', confirm: '' })
  const [localSettings, setLocalSettings] = useState({
    smsNotifications: false,
    pushNotifications: true,
    profileVisibility: false,
    twoFactorAuth: false,
    saveCardsForCheckout: true,
    marketingConsent: true,
  })
  const [notificationSettings, setNotificationSettings] = useState({
    order_updates: true,
    promotions: true,
    low_stock_alerts: true,
  })

  const [orders, setOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)

  const [loyaltyData, setLoyaltyData] = useState({
    points: 0,
    tier: 'Silver',
    pointsToNextTier: 5000,
    totalSpent: 0,
    memberSince: new Date(),
  })

  const [profileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: null,
  })

  useEffect(() => {
    const run = async () => {
      await Promise.all([
        fetchUserData(),
        fetchCustomerNotifications(),
        fetchNotificationPreferences(),
      ])
      setLoading(false)
    }
    run()
  }, [])

  const fetchUserData = async () => {
    try {
      const ordersResponse = await orderAPI.list()
      const ordersList = ordersResponse?.data?.results || ordersResponse?.data || []
      setOrders(ordersList.slice(0, 10))

      const totalSpent = ordersList.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
      const points = Math.floor(totalSpent * 0.1)

      let tier = 'Silver'
      let tierTarget = 5000
      if (points >= 5000) {
        tier = 'Gold'
        tierTarget = 10000
      }
      if (points >= 10000) {
        tier = 'Platinum'
        tierTarget = 20000
      }

      setLoyaltyData({
        points,
        tier,
        pointsToNextTier: Math.max(0, tierTarget - points),
        totalSpent,
        memberSince: user?.date_joined || new Date(),
      })
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      showNotification('Failed to load dashboard data', 'error')
    }
  }

  const fetchCustomerNotifications = async () => {
    try {
      const response = await notificationAPI.getCustomerNotifications({ limit: 10 })
      const data = response?.data || {}
      setNotifications(data.notifications || [])
      setUnreadCount(Number(data.unread_count || 0))
    } catch (error) {
      console.error('Failed to fetch customer notifications:', error)
    }
  }

  const fetchNotificationPreferences = async () => {
    try {
      const response = await notificationAPI.getPreferences()
      const prefs = response?.data || {}
      setNotificationSettings((prev) => ({
        ...prev,
        order_updates: Boolean(prefs.order_updates ?? prev.order_updates),
        promotions: Boolean(prefs.promotions ?? prev.promotions),
        low_stock_alerts: Boolean(prefs.low_stock_alerts ?? prev.low_stock_alerts),
      }))
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    }
  }

  const handleReorder = async (orderId) => {
    try {
      setReorderingOrderId(orderId)
      await orderAPI.reorder(orderId)
      await refreshCart()
      showNotification(`Order #${orderId} items added to cart`, 'success')
      navigate('/cart')
    } catch (error) {
      console.error('Failed to reorder:', error)
      showNotification('Failed to reorder. Please try again.', 'error')
    } finally {
      setReorderingOrderId(null)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      showNotification('Logged out successfully', 'success')
    } catch (error) {
      showNotification('Failed to logout', 'error')
    }
  }

  const handleTogglePreference = async (key) => {
    const nextValue = !notificationSettings[key]
    setNotificationSettings((prev) => ({ ...prev, [key]: nextValue }))
    try {
      await notificationAPI.updatePreferences({ [key]: nextValue })
      showNotification('Notification preference updated', 'success')
    } catch (error) {
      setNotificationSettings((prev) => ({ ...prev, [key]: !nextValue }))
      showNotification('Could not save preference', 'error')
    }
  }

  const handleToggleLocalSetting = (key) => {
    setLocalSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markCustomerAsRead(id)
      await fetchCustomerNotifications()
    } catch (error) {
      showNotification('Could not mark notification as read', 'error')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllCustomerAsRead()
      await fetchCustomerNotifications()
      showNotification('All notifications marked as read', 'success')
    } catch (error) {
      showNotification('Could not mark all notifications as read', 'error')
    }
  }

  const handleDeleteNotification = async (id) => {
    try {
      await notificationAPI.deleteCustomerNotification(id)
      await fetchCustomerNotifications()
    } catch (error) {
      showNotification('Could not delete notification', 'error')
    }
  }

  const handleAddTestNotification = async () => {
    try {
      await notificationAPI.createCustomerNotification({
        title: 'Dashboard Reminder',
        message: 'You can now manage quick actions from the toast menu.',
        link: '/dashboard',
      })
      await fetchCustomerNotifications()
      showNotification('Test notification added', 'success')
    } catch (error) {
      showNotification('Could not add notification', 'error')
    }
  }

  const getOrderStatus = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    }
    return statusMap[status] || statusMap.pending
  }

  const tierStyle = useMemo(() => {
    if (loyaltyData.tier === 'Platinum') return { icon: '💎', gradient: 'from-slate-400 to-slate-600' }
    if (loyaltyData.tier === 'Gold') return { icon: '🏆', gradient: 'from-amber-400 to-amber-600' }
    return { icon: '⭐', gradient: 'from-zinc-400 to-zinc-600' }
  }, [loyaltyData.tier])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ShoppingBag },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const SettingsToggle = ({ label, hint, enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between rounded-lg p-3 ${currentTheme.secondary} border border-gray-200 dark:border-gray-700`}
    >
      <div className="text-left">
        <p className={`${currentTheme.text} font-medium`}>{label}</p>
        <p className={`${currentTheme.textMuted} text-xs`}>{hint}</p>
      </div>
      {enabled ? (
        <ToggleRight className="w-6 h-6 text-green-500" />
      ) : (
        <ToggleLeft className="w-6 h-6 text-gray-400" />
      )}
    </button>
  )

  const NotificationPanel = () => (
    <AnimatePresence>
      {showNotificationsPanel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`absolute right-0 top-14 w-96 ${currentTheme.card} border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`${currentTheme.text} font-semibold`}>Notifications</h3>
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-auto space-y-2">
            {notifications.length === 0 && (
              <p className={`${currentTheme.textMuted} text-sm`}>No notifications yet.</p>
            )}
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg p-3 border ${item.is_read ? 'border-gray-200 dark:border-gray-700' : 'border-blue-300'} ${currentTheme.secondary}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`${currentTheme.text} text-sm font-medium`}>{item.title}</p>
                    <p className={`${currentTheme.textMuted} text-xs mt-1`}>{item.message}</p>
                  </div>
                  <button onClick={() => handleDeleteNotification(item.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const ToastMenu = () => (
    <AnimatePresence>
      {showToastMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          className={`absolute right-0 top-14 w-72 ${currentTheme.card} border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50`}
        >
          <p className={`${currentTheme.text} font-semibold mb-3`}>Quick Actions Menu</p>
          <div className="space-y-2">
            <button
              onClick={() => setButtonsVisible((prev) => !prev)}
              className={`w-full text-left rounded-lg px-3 py-2 ${currentTheme.secondary}`}
            >
              {buttonsVisible ? 'Hide top action buttons' : 'Show top action buttons'}
            </button>
            <button
              onClick={() => {
                setActiveSection('orders')
                setShowToastMenu(false)
              }}
              className={`w-full text-left rounded-lg px-3 py-2 ${currentTheme.secondary}`}
            >
              Jump to Orders
            </button>
            <button
              onClick={() => {
                setActiveSection('settings')
                setShowToastMenu(false)
              }}
              className={`w-full text-left rounded-lg px-3 py-2 ${currentTheme.secondary}`}
            >
              Jump to Settings
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const DashboardOverview = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br ${tierStyle.gradient} rounded-3xl p-8 text-white shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm font-medium mb-2">Your Tier</p>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <span>{tierStyle.icon}</span>
              {loyaltyData.tier} Member
            </h1>
          </div>
          <Award className="w-16 h-16 opacity-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/80 text-sm mb-1">Total Points</p>
            <p className="text-2xl font-bold">{loyaltyData.points}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Total Spent</p>
            <p className="text-2xl font-bold">{formatPrice(loyaltyData.totalSpent)}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${currentTheme.card} rounded-2xl p-6 border border-gray-200 dark:border-gray-700`}>
          <p className={`${currentTheme.textMuted} text-sm mb-1`}>Total Orders</p>
          <p className={`${currentTheme.text} text-3xl font-bold`}>{orders.length}</p>
        </div>
        <div className={`${currentTheme.card} rounded-2xl p-6 border border-gray-200 dark:border-gray-700`}>
          <p className={`${currentTheme.textMuted} text-sm mb-1`}>Loyalty Points</p>
          <p className={`${currentTheme.text} text-3xl font-bold`}>{loyaltyData.points}</p>
        </div>
        <div className={`${currentTheme.card} rounded-2xl p-6 border border-gray-200 dark:border-gray-700`}>
          <p className={`${currentTheme.textMuted} text-sm mb-1`}>Wishlist Count</p>
          <p className={`${currentTheme.text} text-3xl font-bold`}>{getWishlistCount()}</p>
        </div>
        <div className={`${currentTheme.card} rounded-2xl p-6 border border-gray-200 dark:border-gray-700`}>
          <p className={`${currentTheme.textMuted} text-sm mb-1`}>Member Tier</p>
          <p className={`${currentTheme.text} text-3xl font-bold`}>{loyaltyData.tier}</p>
        </div>
      </div>

      <div>
        <h2 className={`${currentTheme.text} text-2xl font-bold mb-4`}>Wishlist Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(wishlistItems || []).slice(0, 3).map((item) => (
            <div key={item.id} className={`${currentTheme.card} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}>
              <p className={`${currentTheme.text} font-medium`}>{item.name || 'Wishlist Item'}</p>
              <p className={`${currentTheme.textMuted} text-sm mt-1`}>{formatPrice(item.price || 0)}</p>
            </div>
          ))}
          {(wishlistItems || []).length === 0 && (
            <div className={`${currentTheme.card} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}>
              <p className={`${currentTheme.textMuted} text-sm`}>No wishlist items yet.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const OrdersSection = () => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className={`${currentTheme.text} text-2xl font-bold mb-6`}>Recent Orders</h2>
      {orders.length === 0 ? (
        <div className={`${currentTheme.card} rounded-xl p-8 border border-gray-200 dark:border-gray-700`}>
          <p className={`${currentTheme.textMuted}`}>No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getOrderStatus(order.status)
            const isDelivered = order.status === 'delivered'
            return (
              <div key={order.id} className={`${currentTheme.card} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className={`${currentTheme.text} font-semibold`}>Order #{order.id}</p>
                      <span className={`${statusInfo.color} rounded-full px-3 py-1 text-xs`}>{statusInfo.label}</span>
                    </div>
                    <p className={`${currentTheme.textMuted} text-sm`}>{new Date(order.created_at).toLocaleDateString('en-KE')}</p>
                    <p className={`${currentTheme.text} font-semibold mt-1`}>{formatPrice(order.total_amount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/orders?id=${order.id}`} className={`${currentTheme.secondary} rounded-lg px-4 py-2 flex items-center gap-2`}>
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    {isDelivered && (
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderingOrderId === order.id}
                        className={`${currentTheme.button} text-white rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50`}
                      >
                        <RotateCw className="w-4 h-4" />
                        {reorderingOrderId === order.id ? 'Reordering...' : 'Reorder'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )

  const WishlistSection = () => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className={`${currentTheme.text} text-2xl font-bold mb-6`}>Wishlist</h2>
      <p className={`${currentTheme.textMuted} mb-4`}>You have {getWishlistCount()} saved items.</p>
      <Link to="/wishlist" className={`${currentTheme.button} text-white rounded-lg px-5 py-2 inline-block`}>
        Open Wishlist
      </Link>
    </motion.div>
  )

  const ProfileSection = () => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className={`${currentTheme.text} text-2xl font-bold mb-6`}>Profile</h2>
      <div className={`${currentTheme.card} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={`${currentTheme.textMuted} text-sm`}>First Name</p>
            <p className={`${currentTheme.text}`}>{profileData.firstName}</p>
          </div>
          <div>
            <p className={`${currentTheme.textMuted} text-sm`}>Last Name</p>
            <p className={`${currentTheme.text}`}>{profileData.lastName}</p>
          </div>
          <div>
            <p className={`${currentTheme.textMuted} text-sm`}>Email</p>
            <p className={`${currentTheme.text}`}>{profileData.email}</p>
          </div>
          <div>
            <p className={`${currentTheme.textMuted} text-sm`}>Phone</p>
            <p className={`${currentTheme.text}`}>{profileData.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const SettingsSection = () => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className={`${currentTheme.text} text-2xl font-bold mb-2`}>Settings</h2>

      <div className={`${currentTheme.card} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
        <button
          onClick={() => setShowPasswordChange((prev) => !prev)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Lock className={`w-5 h-5 ${currentTheme.accent}`} />
            <div className="text-left">
              <p className={`${currentTheme.text} font-semibold`}>Change Password</p>
              <p className={`${currentTheme.textMuted} text-sm`}>Update your account password</p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 ${currentTheme.textMuted} ${showPasswordChange ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showPasswordChange && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <input
                value={passwordData.old}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, old: e.target.value }))}
                type="password"
                placeholder="Current password"
                className={`w-full rounded-lg px-3 py-2 ${currentTheme.secondary} border border-gray-200 dark:border-gray-700`}
              />
              <input
                value={passwordData.next}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, next: e.target.value }))}
                type="password"
                placeholder="New password"
                className={`w-full rounded-lg px-3 py-2 ${currentTheme.secondary} border border-gray-200 dark:border-gray-700`}
              />
              <input
                value={passwordData.confirm}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirm: e.target.value }))}
                type="password"
                placeholder="Confirm password"
                className={`w-full rounded-lg px-3 py-2 ${currentTheme.secondary} border border-gray-200 dark:border-gray-700`}
              />
              <button className={`${currentTheme.button} text-white rounded-lg px-4 py-2`}>Update Password</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`${currentTheme.card} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`${currentTheme.text} font-semibold`}>Customer Notifications</p>
            <p className={`${currentTheme.textMuted} text-sm`}>Control what updates you receive.</p>
          </div>
          <button onClick={handleAddTestNotification} className={`${currentTheme.button} text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2`}>
            <PlusCircle className="w-4 h-4" />
            Add Test
          </button>
        </div>

        <div className="space-y-2">
          <SettingsToggle
            label="Order Updates"
            hint="Get notified about order status changes"
            enabled={notificationSettings.order_updates}
            onToggle={() => handleTogglePreference('order_updates')}
          />
          <SettingsToggle
            label="Promotions"
            hint="Receive offers and discounts"
            enabled={notificationSettings.promotions}
            onToggle={() => handleTogglePreference('promotions')}
          />
          <SettingsToggle
            label="Low Stock Alerts"
            hint="Useful for wishlist items that are running low"
            enabled={notificationSettings.low_stock_alerts}
            onToggle={() => handleTogglePreference('low_stock_alerts')}
          />
        </div>
      </div>

      <div className={`${currentTheme.card} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
        <p className={`${currentTheme.text} font-semibold mb-3`}>More Customer Options</p>
        <div className="space-y-2">
          <SettingsToggle
            label="SMS Notifications"
            hint="Receive order and promo alerts by SMS"
            enabled={localSettings.smsNotifications}
            onToggle={() => handleToggleLocalSetting('smsNotifications')}
          />
          <SettingsToggle
            label="Push Notifications"
            hint="Browser and app push alerts"
            enabled={localSettings.pushNotifications}
            onToggle={() => handleToggleLocalSetting('pushNotifications')}
          />
          <SettingsToggle
            label="Public Profile Visibility"
            hint="Show your profile in community features"
            enabled={localSettings.profileVisibility}
            onToggle={() => handleToggleLocalSetting('profileVisibility')}
          />
          <SettingsToggle
            label="Two-factor Authentication"
            hint="Add another security layer at login"
            enabled={localSettings.twoFactorAuth}
            onToggle={() => handleToggleLocalSetting('twoFactorAuth')}
          />
          <SettingsToggle
            label="Save Cards for Checkout"
            hint="Save payment details securely for faster checkout"
            enabled={localSettings.saveCardsForCheckout}
            onToggle={() => handleToggleLocalSetting('saveCardsForCheckout')}
          />
          <SettingsToggle
            label="Marketing Consent"
            hint="Allow personalized marketing campaigns"
            enabled={localSettings.marketingConsent}
            onToggle={() => handleToggleLocalSetting('marketingConsent')}
          />
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <LogOut className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-red-600 dark:text-red-400 font-semibold">Logout</p>
            <p className="text-red-500/70 text-sm">Sign out from your account</p>
          </div>
        </div>
      </button>
    </motion.div>
  )

  if (loading) {
    return (
      <LuxuryBackground theme={theme}>
        <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
          <LoadingSpinner />
        </div>
      </LuxuryBackground>
    )
  }

  return (
    <LuxuryBackground theme={theme}>
      <div className={`min-h-screen ${currentTheme.background} flex`}>
        <aside className={`hidden lg:block fixed left-0 top-0 h-screen w-[280px] ${currentTheme.nav} border-r border-gray-200 dark:border-gray-700 z-40`}>
          <div className="p-6 flex flex-col h-full">
            <Link to="/" className={`text-2xl font-bold ${currentTheme.accent} mb-8 block`}>
              Glow Beyond
            </Link>
            <nav className="space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive ? `${currentTheme.button} text-white` : `${currentTheme.secondary} ${currentTheme.text}`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                  </button>
                )
              })}
            </nav>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 mt-4`}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 lg:ml-[280px]">
          <div className={`sticky top-0 z-30 ${currentTheme.nav} border-b border-gray-200 dark:border-gray-700`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className={`lg:hidden ${currentTheme.secondary} p-2 rounded-lg`}
                >
                  {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <h1 className={`${currentTheme.text} text-2xl font-bold`}>My Account</h1>
                <Link
                  to="/shop"
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 ${currentTheme.button} text-white rounded-lg hover:opacity-90 transition-opacity`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop
                </Link>
              </div>

              <div className="relative flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowToastMenu((prev) => !prev)
                    setShowNotificationsPanel(false)
                  }}
                  className={`${currentTheme.secondary} p-2 rounded-lg`}
                  title="Quick menu"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <ToastMenu />

                {buttonsVisible && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowNotificationsPanel((prev) => !prev)
                          setShowToastMenu(false)
                        }}
                        className={`relative ${currentTheme.secondary} p-2 rounded-lg`}
                      >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <NotificationPanel />
                    </div>

                    <Link to="/cart" className={`relative ${currentTheme.secondary} p-2 rounded-lg`}>
                      <ShoppingBag className="w-5 h-5" />
                      {getCartCount() > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                          {getCartCount()}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <img
                  src={user?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {mobileSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -280 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -280 }}
                className={`fixed inset-0 z-40 lg:hidden ${currentTheme.nav} mt-16`}
              >
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id)
                          setMobileSidebarOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                          isActive ? `${currentTheme.button} text-white` : `${currentTheme.secondary} ${currentTheme.text}`
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeSection === 'dashboard' && <DashboardOverview />}
            {activeSection === 'orders' && <OrdersSection />}
            {activeSection === 'wishlist' && <WishlistSection />}
            {activeSection === 'profile' && <ProfileSection />}
            {activeSection === 'settings' && <SettingsSection />}
          </main>
        </div>
      </div>
    </LuxuryBackground>
  )
}

export default CustomerAccountDashboard
