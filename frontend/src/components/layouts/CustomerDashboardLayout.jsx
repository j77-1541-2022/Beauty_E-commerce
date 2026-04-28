import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Heart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotification } from '../../contexts/NotificationContext'
import './CustomerDashboardLayout.css'

const CustomerDashboardLayout = ({ children }) => {
  const { user, logout } = useCustomerAuth()
  const { isDark, currentTheme } = useTheme()
  const { showNotification } = useNotification()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard',
      badge: null
    },
    {
      label: 'My Orders',
      icon: <Package className="w-5 h-5" />,
      path: '/orders',
      badge: null
    },
    {
      label: 'Wishlist',
      icon: <Heart className="w-5 h-5" />,
      path: '/wishlist',
      badge: null
    },
    {
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      path: '/profile',
      badge: null
    },
    {
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '/settings',
      badge: null
    }
  ]

  const handleLogout = async () => {
    try {
      await logout()
      showNotification('Logged out successfully', 'success')
      navigate('/login')
    } catch (error) {
      showNotification('Logout failed', 'error')
    }
  }

  const NavLink_Item = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? `${currentTheme.button} text-white shadow-lg`
            : `${currentTheme.textMuted} hover:${currentTheme.secondary} hover:text-white`
        }`
      }
    >
      {item.icon}
      <span className="font-medium">{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
          {item.badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`hidden md:flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2"
            >
              <div className={`w-8 h-8 rounded-lg ${currentTheme.button} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">GB</span>
              </div>
              <span className={`text-lg font-bold ${currentTheme.accent}`}>Glow Beyond</span>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${currentTheme.secondary}`}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.path} title={!sidebarOpen ? item.label : ''}>
              <NavLink_Item item={item} />
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {sidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm font-medium ${currentTheme.text}`}>{user?.email}</p>
                <p className={`text-xs ${currentTheme.textMuted} mt-1`}>Member since {new Date(user?.date_joined).getFullYear()}</p>
              </div>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-2 px-4 py-2 ${currentTheme.secondary} text-red-500 hover:bg-red-500/10 rounded-lg transition-colors`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </motion.div>
          ) : (
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center p-2 ${currentTheme.secondary} text-red-500 hover:bg-red-500/10 rounded-lg transition-colors`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center justify-between p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg ${currentTheme.secondary}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className={`font-bold ${currentTheme.accent}`}>Glow Beyond</span>
          <Bell className={`w-6 h-6 ${currentTheme.textMuted}`} />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 space-y-2`}
            >
              {navItems.map((item) => (
                <NavLink_Item key={item.path} item={item} />
              ))}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-2 px-4 py-2 ${currentTheme.secondary} text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default CustomerDashboardLayout
