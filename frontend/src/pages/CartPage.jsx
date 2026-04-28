import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  CreditCard
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'
import LuxuryBackground from '../components/LuxuryBackground'
import orderAPI from '../services/orderAPI'

const CartPage = () => {
  const navigate = useNavigate()
  const { user } = useCustomerAuth()
  const { formatPrice } = useCurrency()
  const { currentTheme, theme } = useTheme()
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity,
    clearCart, 
    getCartTotal, 
    getCartCount,
    refreshCart,
    loading 
  } = useCart()

  const [placingOrder, setPlacingOrder] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Fetch cart on mount
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return
    
    setUpdating(true)
    
    try {
      // Use CartContext's updateQuantity
      await updateQuantity(productId, quantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdating(false)
    }
  }

  const removeItem = (productId) => {
    removeFromCart(productId)
  }

  const placeOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert('Your cart is empty!')
      return
    }

    // Check if user is logged in
    if (!user) {
      localStorage.setItem('redirectAfterLogin', '/checkout')
      navigate('/login')
      return
    }
    
    // Navigate to checkout with cart data
    navigate('/checkout', { state: { cartItems, cartTotal: getCartTotal() } })
  }

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
      <div className={`min-h-screen ${currentTheme.background}`}>
        {/* Header */}
        <div className={`${currentTheme.nav} sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className={`text-2xl font-bold ${currentTheme.accent}`}>
                  Glow Beyond Beauty
                </Link>
                <Link to="/shop" className={`${currentTheme.textMuted} hover:${currentTheme.accent} transition-colors`}>
                  Shop
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className={`${currentTheme.textMuted} hover:${currentTheme.accent} transition-colors`}>
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Link
                to="/shop"
                className={`flex items-center ${currentTheme.textMuted} hover:${currentTheme.accent} transition-colors`}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Shop
              </Link>
            </div>
            
            <h1 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>Shopping Cart</h1>
            <p className={currentTheme.textMuted}>
              {getCartCount() === 0 ? 'Your cart is empty' : `${getCartCount()} items in your cart`}
            </p>
          </motion.div>

          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className={`inline-flex items-center justify-center w-24 h-24 ${currentTheme.card} rounded-full mb-6`}>
                <ShoppingBag className={`w-12 h-12 ${currentTheme.textMuted}`} />
              </div>
              <h2 className={`text-2xl font-semibold ${currentTheme.text} mb-4`}>Your cart is empty</h2>
              <p className={`${currentTheme.textMuted} mb-8`}>
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link
                to="/shop"
                className={`inline-flex items-center px-6 py-3 ${currentTheme.button} font-semibold rounded-lg ${currentTheme.primaryHover} transition-all`}
              >
                Continue Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${currentTheme.card} ${currentTheme.cardBorder} border rounded-2xl ${currentTheme.shadow} p-6`}
                >
                  <div className="space-y-6">
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 ${currentTheme.secondary} rounded-lg`}
                      >
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          {item.primary_image ? (
                            <img
                              src={item.primary_image}
                              alt={item.name}
                              className="w-full sm:w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className={`w-full sm:w-20 h-20 ${currentTheme.secondary} rounded-lg flex items-center justify-center`}>
                              <ShoppingBag className={`w-8 h-8 ${currentTheme.textMuted}`} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className={`text-lg font-semibold ${currentTheme.text} truncate`}>
                            {item.name}
                          </h3>
                          <p className={`text-sm ${currentTheme.textMuted}`}>{item.category_name || 'No category'}</p>
                          <p className={`text-lg font-bold ${currentTheme.accent}`}>
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updating}
                            className={`w-8 h-8 rounded-full ${currentTheme.secondary} hover:opacity-80 flex items-center justify-center transition-colors`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <span className={`w-12 text-center font-semibold ${currentTheme.text}`}>
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updating}
                            className={`w-8 h-8 rounded-full ${currentTheme.secondary} hover:opacity-80 flex items-center justify-center transition-colors`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-lg font-bold ${currentTheme.text}`}>
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={updating}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`${currentTheme.card} ${currentTheme.cardBorder} border rounded-2xl ${currentTheme.shadow} p-6 sticky top-24`}
                >
                  <h2 className={`text-xl font-semibold ${currentTheme.text} mb-6`}>Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className={`flex justify-between ${currentTheme.textMuted}`}>
                      <span>Subtotal ({getCartCount()} items)</span>
                      <span>{formatPrice(getCartTotal())}</span>
                    </div>
                    <div className={`flex justify-between ${currentTheme.textMuted}`}>
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className={`flex justify-between ${currentTheme.textMuted}`}>
                      <span>Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className={`border-t ${currentTheme.cardBorder} pt-4`}>
                      <div className={`flex justify-between text-lg font-semibold ${currentTheme.text}`}>
                        <span>Total</span>
                        <span>{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder || cartItems.length === 0}
                    className={`w-full flex items-center justify-center px-6 py-3 ${currentTheme.button} font-semibold rounded-lg ${currentTheme.primaryHover} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {placingOrder ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Place Order
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-center">
                    <Link
                      to="/shop"
                      className={`${currentTheme.link} transition-colors`}
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LuxuryBackground>
  )
}

export default CartPage
