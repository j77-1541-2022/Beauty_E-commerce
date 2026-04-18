import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    { path: '/admin/insights', label: 'AI Insights ✨', icon: Sparkles },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  ]

  const handleLogout = () => {
    logout()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{
          x: isMobile ? (sidebarOpen ? 0 : -300) : 0,
          transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass-card m-4 lg:m-0 lg:rounded-none transform transition-transform duration-300 ${isMobile && !sidebarOpen ? '-translate-x-full' : ''
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/20 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">BeautyStock</h1>
              <p className="text-sm text-gray-600">Inventory Management</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800">{user?.username}</p>
                <p className="text-sm text-gray-600">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden glass-card m-4 p-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout
