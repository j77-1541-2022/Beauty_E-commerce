import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, 
  User, 
  LogOut, 
  Menu,
  X
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useTheme } from '../contexts/ThemeContext'

const CustomerNavbar = () => {
  const { user, logout, isAuthenticated } = useCustomerAuth()
  const { getDashboardRoute } = useAuth()
  const { getCartCount } = useCart()
  const { colors } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const isActive = (path) => location.pathname === path

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all transform translate-x-0 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => {
      notification.classList.add('translate-x-full', 'opacity-0')
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  return (
    <div className={`${colors.nav} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className={`text-2xl font-bold ${colors.primary} bg-clip-text text-transparent`}>
              Glow Beyond Beauty
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`transition-colors ${
                isActive('/') ? `${colors.accent} font-semibold` : `${colors.text} hover:${colors.accent}`
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`transition-colors ${
                isActive('/shop') ? `${colors.accent} font-semibold` : `${colors.text} hover:${colors.accent}`
              }`}
            >
              Shop
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  className={`transition-colors ${
                    isActive(getDashboardRoute()) ? `${colors.accent} font-semibold` : `${colors.text} hover:${colors.accent}`
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/cart"
                  className={`relative transition-colors ${
                    isActive('/cart') ? `${colors.accent} font-semibold` : `${colors.text} hover:${colors.accent}`
                  }`}
                >
                  <ShoppingBag className="w-6 h-6" />
                  {getCartCount() > 0 && (
                    <span className={`absolute -top-2 -right-2 ${colors.primary} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                      {getCartCount() > 99 ? '99+' : getCartCount()}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${colors.textMuted}`}>Hi, {user?.first_name || user?.username}</span>
                  <button
                    onClick={() => {
                      logout()
                      showNotification('Logged out successfully', 'success')
                      navigate('/shop')
                    }}
                    className={`flex items-center space-x-1 ${colors.text} hover:text-red-600 transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-gray-200"
          >
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`text-gray-700 hover:text-purple-600 transition-colors ${
                  isActive('/') ? 'text-purple-600 font-semibold' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className={`text-gray-700 hover:text-purple-600 transition-colors ${
                  isActive('/shop') ? 'text-purple-600 font-semibold' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-gray-700 hover:text-purple-600 transition-colors ${
                      isActive('/dashboard') ? 'text-purple-600 font-semibold' : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/cart"
                    className={`text-gray-700 hover:text-purple-600 transition-colors ${
                      isActive('/cart') ? 'text-purple-600 font-semibold' : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cart
                  </Link>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">Hi, {user?.first_name || user?.username}</span>
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                        showNotification('Logged out successfully', 'success')
                        navigate('/shop')
                      }}
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-purple-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CustomerNavbar
