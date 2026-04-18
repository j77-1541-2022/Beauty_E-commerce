import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  ShoppingCart,
  Star,
  ArrowRight,
  Trash2,
  Sparkles,
  Package
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { useCurrency } from '../contexts/CurrencyContext'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedBackground from '../components/AnimatedBackground'
import BeautyLogo from '../components/BeautyLogo'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import useApiAction from '../hooks/useApiAction'
import { getProductPlaceholder } from '../utils/productImage'

const WishlistPage = () => {
  const { isAuthenticated } = useCustomerAuth()
  const { isDark } = useTheme()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart, isInCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [removingItems, setRemovingItems] = useState(new Set())
  const [addingToCart, setAddingToCart] = useState(new Set())

  const { run: runWishlistAddToCart } = useApiAction(
    'wishlist.addToCart',
    async (product) => {
      const success = await addToCart(product, 1)
      if (!success) {
        throw new Error('Failed to add to cart')
      }
      await removeFromWishlist(product.id)
      return true
    },
    {
      context: 'Wishlist Add To Cart',
      startMessage: 'Adding item to cart...',
      successMessage: 'Moved from wishlist to cart',
      errorMessage: 'Could not move item to cart',
    }
  )

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setLoading(false)
  }, [isAuthenticated])

  const handleRemoveFromWishlist = async (productId) => {
    setRemovingItems(prev => new Set(prev).add(productId))

    try {
      await removeFromWishlist(productId)
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleAddToCart = async (product) => {
    setAddingToCart(prev => new Set(prev).add(product.id))

    try {
      await runWishlistAddToCart(product)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  const handleClearWishlist = async () => {
    try {
      await clearWishlist()
    } catch (error) {
      console.error('Failed to clear wishlist:', error)
    }
  }

  const calculateTotal = () => {
    return wishlistItems.reduce((total, item) => {
      const itemTotal = item.discount > 0
        ? item.price * (1 - item.discount / 100)
        : item.price
      return total + itemTotal
    }, 0)
  }

  if (loading) {
    return (
      <AnimatedBackground variant="sunset">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground variant="sunset">
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/dashboard" className="flex items-center text-white hover:text-purple-200 transition-colors">
                <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                Back to Dashboard
              </Link>
              <BeautyLogo size="medium" animated={true} />
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <span className="text-white">{wishlistItems.length}</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-6"
            >
              <Heart className="w-8 h-8 text-white fill-current" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">My Wishlist</h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Your favorite beauty products, all in one place
            </p>
          </div>

          {wishlistItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Heart className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-white mb-4">Your wishlist is empty</h2>
              <p className="text-purple-200 mb-8">
                Start adding your favorite products to see them here
              </p>
              <Link to="/shop">
                <AnimatedButton
                  icon={<ShoppingCart className="w-5 h-5" />}
                >
                  Start Shopping
                </AnimatedButton>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <GlassCard className="overflow-hidden">
                    <div className="relative">
                      <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = getProductPlaceholder(item)
                          }}
                        />

                        {/* Discount Badge */}
                        {item.discount > 0 && (
                          <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{item.discount}%
                          </div>
                        )}

                        {/* Stock Status */}
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Out of Stock
                            </span>
                          </div>
                        )}

                        {/* Remove Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveFromWishlist(item.id)}
                          disabled={removingItems.has(item.id)}
                          className="absolute top-4 left-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                        >
                          {removingItems.has(item.id) ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(item.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-400'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-purple-200 ml-2">
                          {item.rating} ({item.reviews})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-white">
                            ${item.discount > 0
                              ? (item.price * (1 - item.discount / 100)).toFixed(2)
                              : item.price
                            }
                          </span>
                          {item.discount > 0 && (
                            <span className="text-sm text-purple-300 line-through ml-2">
                              ${item.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Added Date */}
                      <p className="text-xs text-purple-300 mb-4">
                        Added on {new Date(item.addedDate).toLocaleDateString()}
                      </p>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/product/${item.id}`}
                          className="flex-1 text-center py-2 px-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                          View Details
                        </Link>
                        <AnimatedButton
                          onClick={() => handleAddToCart(item.id)}
                          disabled={!item.inStock}
                          className="flex-1"
                          size="sm"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add to Cart
                        </AnimatedButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}

          {/* Wishlist Summary */}
          {wishlistItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12"
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Wishlist Summary</h3>
                    <p className="text-purple-200">
                      {wishlistItems.length} items • Total value: ${wishlistItems.reduce((sum, item) =>
                        sum + (item.price * (1 - (item.discount || 0) / 100)), 0
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Link to="/shop">
                      <AnimatedButton variant="outline">
                        Continue Shopping
                      </AnimatedButton>
                    </Link>
                    <AnimatedButton
                      onClick={() => {
                        // Add all items to cart
                        wishlistItems.forEach(item => {
                          if (item.inStock) {
                            handleAddToCart(item.id)
                          }
                        })
                      }}
                    >
                      Add All to Cart
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </motion.main>
      </div>
    </AnimatedBackground>
  )
}

export default WishlistPage
