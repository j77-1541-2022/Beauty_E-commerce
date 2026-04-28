import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, User, LogOut, Menu, X, BarChart2, Brain, AlertTriangle
} from 'lucide-react'
import { GlassCard } from '../../components/ui/InventoryComponents'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { ThemeSwitcher } from '../../components/theme/ThemeSwitcher'

const DealerLayout = () => {
  const { user, logout } = useAuth()
  const { colors, theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  // TODO: Fetch lowStockCount for badge
  const lowStockCount = 0; // Replace with actual count from API if needed
  const menuItems = [
    { path: '/dealer', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dealer/orders', label: 'My Orders', icon: ShoppingBag },
    { path: '/dealer/products', label: 'My Products', icon: Package },
    { path: '/dealer/inventory', label: 'Inventory', icon: AlertTriangle },
    {
      label: 'Reports',
      path: '/dealer/reports',
      icon: BarChart2,
      badge: lowStockCount,
      description: 'Dealer reports access',
    },
    {
      label: 'DSS Insights',
      path: '/dealer/analytics',
      icon: Brain,
      description: 'Forecast, ABC, EOQ',
    },
    { path: '/dealer/earnings', label: 'Earnings', icon: Wallet },
    { path: '/dealer/profile', label: 'Profile', icon: User },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {sidebarOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobile ? (sidebarOpen ? 0 : -300) : 0 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 ${colors.card} backdrop-blur-xl border-r ${colors.cardBorder} m-4 rounded-2xl lg:m-0 lg:rounded-none shadow-xl lg:shadow-none`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-xl font-bold ${colors.primary} bg-clip-text text-transparent`}>
              Dealer Portal
            </h1>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg`}>
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? `${colors.primary} text-white shadow-lg`
                      : `${colors.textMuted} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className={`pt-4 border-t ${colors.cardBorder}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${colors.text}`}>{user?.username}</p>
                <p className={`text-xs ${colors.textMuted}`}>Dealer Account</p>
              </div>
              <ThemeSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 w-full text-red-600 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} rounded-xl transition-all`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`lg:hidden flex items-center justify-between p-4 ${colors.card} backdrop-blur-xl border-b ${colors.cardBorder}`}>
          <h1 className={`text-lg font-bold ${colors.primary} bg-clip-text text-transparent`}>
            Dealer Portal
          </h1>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button onClick={() => setSidebarOpen(true)} className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg`}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DealerLayout
