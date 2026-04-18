// Fix: Define handleProductClick to open product details/modal
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  }
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Star,
  Heart,
  TrendingUp,
  Gift,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  Target,
  BarChart3,
  Users,
  Crown,
  Gem,
  ShoppingCart,
  Percent,
  Truck,
  Shield,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  Filter,
  X,
  Eye,
  Search,
  ThumbsUp,
  Share2,
  RotateCw
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { customerAPI } from '../services/customerAPI'
import { cartAPI } from '../services/cartAPI'
import { wishlistAPI } from '../services/wishlistAPI'
import inventoryAPI from '../services/inventoryAPI'
import LoadingSpinner from '../components/LoadingSpinner'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import SkeletonLoader from '../components/SkeletonLoader'
import AnimatedBackground from '../components/AnimatedBackground'
import BeautyLogo from '../components/BeautyLogo'
import CurrencySelector from '../components/CurrencySelector'
import ProductModal from '../components/ProductModal'
import ProfileEditModal from '../components/ProfileEditModal'
import { getProductPlaceholder, resolveProductImage } from '../utils/productImage'

const EnhancedCustomerDashboard = () => {
  const { user, logout } = useCustomerAuth()
  const { isDark } = useTheme()
  const { formatPrice } = useCurrency()
  const { getWishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { addToCart, getCartCount, getCartTotal, refreshCart } = useCart()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [cartData, setCartData] = useState(null)
  const [products, setProducts] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 }) // Updated to KSH range
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Multi-filter combinations state
  const [selectedFilters, setSelectedFilters] = useState({
    brand: [],
    rating: null,
    inStock: false,
    onSale: false,
    newArrivals: false
  })
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  
  // Search autocomplete state
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const notifications = [
    { id: 1, title: 'New Product Alert', message: 'Check out our latest Rose Gold Serum!', time: '2 hours ago' },
    { id: 2, title: 'Special Offer', message: 'Get 20% off on all skincare products!', time: '5 hours ago' },
    { id: 3, title: 'Order Delivered', message: 'Your order #1234 has been delivered!', time: '1 day ago' }
  ]

  // Personalized product recommendations based on user behavior
  const getPersonalizedRecommendations = () => {
    if (!products || products.length === 0) return []
    
    // Simple recommendation algorithm based on categories and price preferences
    const categories = products.map(p => p.category).filter(Boolean)
    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    
    const favoriteCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => cat)
    
    const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
    
    const recommendations = products
      .filter(p => favoriteCategories.includes(p.category) || Math.abs(p.price - avgPrice) < avgPrice * 0.3)
      .slice(0, 6)
      .map(p => ({
        ...p,
        reason: favoriteCategories.includes(p.category) 
          ? `Because you like ${p.category}`
          : 'Based on your price preferences'
      }))
    
    return recommendations
  }

  // Interactive Product Card with micro-interactions
  const InteractiveProductCard = ({ product, reason }) => {
    const [isLiked, setIsLiked] = useState(isInWishlist(product.id))
    const [isAdding, setIsAdding] = useState(false)
    const [showQuickActions, setShowQuickActions] = useState(false)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    
    const rotateX = useTransform(mouseY, [-100, 100], [5, -5])
    const rotateY = useTransform(mouseX, [-100, 100], [-5, 5])
    const scale = useSpring(1, { stiffness: 300, damping: 20 })

    const handleLike = (e) => {
      e.stopPropagation()
      setIsLiked(!isLiked)
      if (!isLiked) {
        addToWishlist(product)
      } else {
        removeFromWishlist(product.id)
      }
    }

    const handleAddToCart = async (e) => {
      e.stopPropagation()
      setIsAdding(true)
      await addToCart(product)
      setTimeout(() => setIsAdding(false), 1000)
    }

    const handleShare = (e) => {
      e.stopPropagation()
      if (navigator.share) {
        navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Beauty E-commerce!`,
          url: window.location.href
        })
      }
    }

    return (
      <motion.div
        style={{ perspective: 1000 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          mouseX.set(e.clientX - rect.left - rect.width / 2)
          mouseY.set(e.clientY - rect.top - rect.height / 2)
        }}
        onMouseLeave={() => {
          mouseX.set(0)
          mouseY.set(0)
        }}
      >
        <motion.div
          style={{ 
            rotateX, 
            rotateY,
            scale
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleProductClick(product)}
          className="cursor-pointer"
        >
          <GlassCard className="p-4" variant="light">
            <div className="relative mb-3 overflow-hidden rounded-xl">
              <img
                src={resolveProductImage(product)}
                alt={product.name}
                className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110"
                onError={(event) => {
                  event.currentTarget.src = getProductPlaceholder(product)
                }}
              />
              
              {/* Quick Actions Overlay */}
              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleLike}
                      className="p-3 bg-white rounded-full shadow-lg"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="p-3 bg-white rounded-full shadow-lg"
                    >
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowProductModal(true)}
                      className="p-3 bg-white rounded-full shadow-lg"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recommendation Badge */}
              {reason && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-purple-600 shadow-md"
                >
                  {reason}
                </motion.div>
              )}

              {/* Like Button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md transition-colors hover:bg-white"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
              </motion.button>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{product.category}</p>
            
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">{formatPrice(product.price)}</p>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                className={`p-2 rounded-lg transition-colors ${
                  isAdding 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isAdding ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    )
  }

  // Multi-filter combinations logic
  const toggleBrandFilter = (brand) => {
    setSelectedFilters(prev => {
      const brands = prev.brand.includes(brand)
        ? prev.brand.filter(b => b !== brand)
        : [...prev.brand, brand]
      return { ...prev, brand: brands }
    })
  }

  const toggleRatingFilter = (rating) => {
    setSelectedFilters(prev => ({
      ...prev,
      rating: prev.rating === rating ? null : rating
    }))
  }

  const toggleBooleanFilter = (key) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const clearAllFilters = () => {
    setSelectedFilters({
      brand: [],
      rating: null,
      inStock: false,
      onSale: false,
      newArrivals: false
    })
    setPriceRange({ min: 0, max: 50000 })
    setSelectedCategory('all')
  }

  // Update active filter count
  useEffect(() => {
    const count = selectedFilters.brand.length +
      (selectedFilters.rating ? 1 : 0) +
      (selectedFilters.inStock ? 1 : 0) +
      (selectedFilters.onSale ? 1 : 0) +
      (selectedFilters.newArrivals ? 1 : 0) +
      (selectedCategory !== 'all' ? 1 : 0) +
      (priceRange.min > 0 || priceRange.max < 50000 ? 1 : 0)
    setActiveFilterCount(count)
  }, [selectedFilters, selectedCategory, priceRange])

  // Search autocomplete logic
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    const suggestions = products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price
      }))

    setSearchSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
    setHighlightedIndex(-1)
  }, [searchTerm, products])

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && searchSuggestions[highlightedIndex]) {
        handleSuggestionClick(searchSuggestions[highlightedIndex])
      } else {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name)
    setShowSuggestions(false)
    const product = products.find(p => p.id === suggestion.id)
    if (product) {
      handleProductClick(product)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  }

  const floatingVariants = {
    float: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching customer dashboard data...')
      
      // Fetch user dashboard stats (loyalty points, tier, orders, cart)
      try {
        const dashboardResponse = await customerAPI.getDashboard()
        console.log('📊 Dashboard response:', dashboardResponse)
        
        if (dashboardResponse?.data) {
          setUserData(dashboardResponse.data.user)
          setRecentOrders(dashboardResponse.data.recent_orders || [])
          setCartData({ items: [], count: dashboardResponse.data.cart_count || 0 })
          console.log('✅ User stats loaded:', {
            loyalty_points: dashboardResponse.data.loyalty_points,
            tier: dashboardResponse.data.tier,
            cart_count: dashboardResponse.data.cart_count,
            total_orders: dashboardResponse.data.total_orders
          })
        }
      } catch (statsError) {
        console.error('⚠️ Failed to fetch user stats:', statsError)
        // Continue with products even if stats fail
      }
      
      // Fetch only available products from admin inventory
      const productsResponse = await inventoryAPI.getAvailableProducts({
        customer_view: true,
        include_inventory_status: true,
        include_dealer_info: true,
        is_active: true
      })
      
      console.log('📦 Raw products from inventory:', productsResponse)
      
      const productsData = Array.isArray(productsResponse) ? productsResponse : productsResponse.results || []
      
      if (productsData.length > 0) {
        console.log('📦 Processing', productsData.length, 'products from inventory')
        
        const processedProducts = productsData.map(product => ({
          id: product.id,
          name: product.name || product.product_name,
          description: product.description || product.product_description,
          price: product.price || product.selling_price || 0,
          original_price: product.original_price,
          discount: product.discount || 0,
          category: product.category || 'uncategorized',
          rating: product.rating || Math.random() * 2 + 3,
          reviews: product.reviews || Math.floor(Math.random() * 100),
          image: resolveProductImage(product),
          is_active: product.is_active !== false,
          // Enhanced inventory status
          stock_quantity: product.stock_quantity || 0,
          stock_status: product.stock_status || 'out_of_stock',
          low_stock_threshold: product.low_stock_threshold || 5,
          // Dealer information
          dealer_info: product.dealer_info || {
            business_name: product.dealer_name || 'Beauty Store',
            is_verified: product.dealer_verified !== false
          },
          // Ensure stock status from dealer/admin inventory
          is_available_from_dealer: product.is_available_for_customers !== false,
          last_inventory_update: product.last_stock_update || new Date().toISOString()
        }))

        setProducts(processedProducts)
        console.log('✅ Processed products for customer view:', processedProducts)
      } else {
        console.log('ℹ️ No products found in admin inventory')
        setProducts([])
      }
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleLikeProduct = async (productId) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      localStorage.setItem('redirectAfterLogin', '/dashboard')
      navigate('/login')
      return
    }

    try {
      // Find the product object from products array
      const product = products.find(p => p.id === productId)
      if (!product) {
        showNotification('Product not found', 'error')
        return
      }

      if (isInWishlist(productId)) {
        // Try to remove from backend wishlist
        try {
          const result = await wishlistAPI.removeFromWishlist(productId)
          if (result.success) {
            removeFromWishlist(productId)
            showNotification('Removed from wishlist', 'info')
          }
        } catch (error) {
          // Fallback to local wishlist
          removeFromWishlist(productId)
          showNotification('Removed from wishlist', 'info')
        }
      } else {
        // Try to add to backend wishlist
        try {
          const result = await wishlistAPI.addToWishlist(productId)
          if (result.success) {
            addToWishlist(product)
            showNotification('Added to wishlist!', 'success')
          }
        } catch (error) {
          // Fallback to local wishlist
          addToWishlist(product)
          showNotification('Added to wishlist!', 'success')
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error)
      showNotification('Failed to update wishlist', 'error')
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      console.log('🛒 Adding to cart:', productId)
      const product = products.find(p => p.id === productId)
      if (!product) {
        showNotification('Product not found', 'error')
        return
      }

      const success = await addToCart(product, 1)
      if (success) {
        showNotification('Product added to cart successfully!', 'success')
        refreshCart()
      } else {
        showNotification('Failed to add to cart', 'error')
      }
    } catch (error) {
      console.error('❌ Failed to add to cart:', error)
      showNotification('Failed to add product to cart', 'error')
    }
  }

  const showNotification = (message, type = 'info') => {
    // Create a simple notification (you can enhance this with a proper notification system)
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

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleViewProduct = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleLogout = async () => {
    try {
      await logout()
      showNotification('Logged out successfully', 'success')
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
      showNotification('Unable to logout right now', 'error')
    }
  }

  const handleSettingsAction = (section) => {
    if (section === 'Profile') {
      setShowProfileEdit(true)
      return
    }
    const messages = {
      Notifications: 'Notification settings let you control alerts for offers, orders and restocks.',
      Security: 'Security options will help you manage password and device access.'
    }
    showNotification(messages[section] || 'Section selected', 'info')
  }

  const dashboardCategories = Array.from(new Set(products.map(product => product.category || 'uncategorized')))

  // Use debounced search term for filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = !debouncedSearchTerm || 
      product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max
    return matchesSearch && matchesCategory && matchesPrice
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return b.rating - a.rating
      case 'name':
        return a.name.localeCompare(b.name)
      case 'trending':
        return (b.recent_orders || 0) - (a.recent_orders || 0)
      case 'discount':
        return b.discount - a.discount
      case 'featured':
      default:
        // Enhanced featured algorithm: considers rating, orders, and discount
        const aScore = (a.rating || 0) * 2 + (a.recent_orders || 0) + (a.discount || 0)
        const bScore = (b.rating || 0) * 2 + (b.recent_orders || 0) + (b.discount || 0)
        return bScore - aScore
    }
  })

  // Personalized recommendations based on user behavior
  const getRecommendations = () => {
    if (!products.length) return []
    
    // Simple recommendation algorithm
    return products
      .filter(product => product.stock_status === 'in_stock')
      .sort((a, b) => {
        // Prioritize high-rated, recently ordered, and discounted items
        const aScore = (a.rating || 0) * 3 + (a.recent_orders || 0) * 2 + (a.discount || 0)
        const bScore = (b.rating || 0) * 3 + (b.recent_orders || 0) * 2 + (b.discount || 0)
        return bScore - aScore
      })
      .slice(0, 6)
  }

  const recommendations = getRecommendations()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <AnimatedBackground variant="midnight">
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-lg border-b border-white/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <BeautyLogo size="medium" animated={true} />
              <div className="flex items-center space-x-4">
                <CurrencySelector />
                <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <Heart className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getWishlistCount()}
                  </span>
                </Link>
                <Link to="/cart" className="relative p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                </Link>
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-white" />
                    {notifications.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                      />
                    )}
                  </motion.button>
                </div>
                <button
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          {showNotifications && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-4 top-full mt-3 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden z-50"
              >
                <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-white/80 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-sm text-white/80 mt-1">Recent alerts and order updates</p>
                </div>
                <div className="divide-y divide-gray-200 bg-white">
                  {notifications.map(notification => (
                    <div key={notification.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                      <p className="font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.header>

        {/* Main Content */}
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 min-h-[80vh]"
        >
                {/* Profile Edit Modal */}
                <ProfileEditModal
                  isOpen={showProfileEdit}
                  onClose={() => setShowProfileEdit(false)}
                  userData={userData}
                  onSave={async (updated) => {
                    // Save profile changes via API
                    try {
                      await customerAPI.updateProfile(updated)
                      setUserData({ ...userData, ...updated })
                      showNotification('Profile updated successfully', 'success')
                      setShowProfileEdit(false)
                    } catch (e) {
                      showNotification('Failed to update profile', 'error')
                    }
                  }}
                />
          {showSettings && (
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <GlassCard className="p-6 bg-white/95 shadow-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>
                    <p className="text-gray-600">Manage your profile shortcuts and notification preferences.</p>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="mt-2 md:mt-0 inline-flex items-center justify-center px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div
                    role="button"
                    onClick={() => handleSettingsAction('Profile')}
                    className="rounded-3xl border border-gray-200 p-5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  >
                    <p className="text-sm uppercase tracking-wide text-gray-500">Profile</p>
                    <p className="mt-2 text-gray-800">Update your account details, delivery address and preferences.</p>
                  </div>
                  <div
                    role="button"
                    onClick={() => handleSettingsAction('Notifications')}
                    className="rounded-3xl border border-gray-200 p-5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  >
                    <p className="text-sm uppercase tracking-wide text-gray-500">Notifications</p>
                    <p className="mt-2 text-gray-800">Control which alerts you receive for offers, orders and restocks.</p>
                  </div>
                  <div
                    role="button"
                    onClick={() => handleSettingsAction('Security')}
                    className="rounded-3xl border border-gray-200 p-5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  >
                    <p className="text-sm uppercase tracking-wide text-gray-500">Security</p>
                    <p className="mt-2 text-gray-800">Sign out from other devices, reset password and review activity.</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
          {/* Welcome Section */}
          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <motion.div
                variants={floatingVariants.float}
                className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
              />
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {userData?.name}! 👋
                </h1>
                <p className="text-purple-100 mb-4">
                  Ready to discover your next favorite beauty product?
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/shop">
                    <AnimatedButton className="bg-white text-purple-600 hover:bg-purple-50">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Shop Now
                    </AnimatedButton>
                  </Link>
                  <Link to="/wishlist">
                    <AnimatedButton variant="outline" className="border-white text-white hover:bg-white/20">
                      <Heart className="w-4 h-4 mr-2" />
                      Wishlist
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personalized Recommendations */}
          {getPersonalizedRecommendations().length > 0 && (
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Recommended For You</h2>
                </div>
                <Link to="/shop" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPersonalizedRecommendations().map((product, index) => (
                  <InteractiveProductCard 
                    key={product.id} 
                    product={product} 
                    reason={product.reason}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <GlassCard className="p-6" variant="light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Loyalty Points</p>
                  <p className="text-2xl font-bold text-gray-900">{userData?.loyaltyPoints}</p>
                </div>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </GlassCard>

            <GlassCard className="p-6" variant="light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Cart Items</p>
                  <p className="text-2xl font-bold text-gray-900">{cartData?.items?.length || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500" />
              </div>
            </GlassCard>

            <GlassCard className="p-6" variant="light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
                </div>
                <Package className="w-8 h-8 text-green-500" />
              </div>
            </GlassCard>

            <GlassCard className="p-6" variant="light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Member Tier</p>
                  <p className="text-2xl font-bold text-gray-900">{userData?.tier}</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </GlassCard>
          </motion.div>

            {/* Personalized Recommendations */}
            {recommendations.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                    Recommended for You
                  </h2>
                  <Link to="/shop?filter=recommended">
                    <AnimatedButton variant="outline" size="sm" className="border-white text-white hover:bg-white/20">
                      View All
                    </AnimatedButton>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.slice(0, 3).map((product, index) => (
                    <motion.div
                      key={`rec-${product.id}`}
                      variants={cardVariants}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="relative"
                    >
                      <GlassCard className="overflow-hidden border-2 border-yellow-400/30" variant="light">
                        {/* Recommendation Badge */}
                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommended
                        </div>
                        
                        {/* Product Image */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = getProductPlaceholder(product)
                            }}
                          />
                          
                          {/* Discount Badge */}
                          {product.discount > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              -{product.discount}%
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900">
                            {product.name}
                          </h3>
                          
                          {/* Rating */}
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(product.rating || 4.5)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              {Number(product.rating || 0).toFixed(1)} ({product.reviews || 0})
                            </span>
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-2xl font-bold text-gray-900">
                                {formatPrice(
                                  product.discount > 0
                                    ? product.price * (1 - product.discount / 100)
                                    : product.price
                                )}
                              </span>
                              {product.discount > 0 && (
                                <span className="text-sm line-through text-gray-500 ml-2">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-2">
                            <AnimatedButton
                              onClick={() => handleViewProduct(product)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </AnimatedButton>
                            <AnimatedButton
                              onClick={() => handleAddToCart(product.id)}
                              size="sm"
                              className="flex-1"
                              disabled={product.stock_status !== 'in_stock'}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              {product.stock_status !== 'in_stock' ? 'Out of Stock' : 'Add to Cart'}
                            </AnimatedButton>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Products Section with Filters */}
          <motion.div
            variants={itemVariants}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <GlassCard className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search with Autocomplete */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      aria-label="Search products"
                      aria-expanded={showSuggestions}
                      aria-haspopup="listbox"
                      aria-controls="search-suggestions"
                    />
                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          id="search-suggestions"
                          role="listbox"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                        >
                          {searchSuggestions.map((suggestion, index) => (
                            <div
                              key={suggestion.id}
                              role="option"
                              aria-selected={index === highlightedIndex}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`px-4 py-3 cursor-pointer transition-colors ${
                                index === highlightedIndex ? 'bg-purple-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{suggestion.name}</span>
                                <span className="text-sm text-gray-500">{formatPrice(suggestion.price)}</span>
                              </div>
                              <span className="text-xs text-gray-400">{suggestion.category}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 rounded-xl border bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="featured" className="text-gray-900 bg-white">Featured</option>
                    <option value="trending" className="text-gray-900 bg-white">Trending</option>
                    <option value="price-low" className="text-gray-900 bg-white">Price: Low to High</option>
                    <option value="price-high" className="text-gray-900 bg-white">Price: High to Low</option>
                    <option value="rating" className="text-gray-900 bg-white">Highest Rated</option>
                    <option value="discount" className="text-gray-900 bg-white">Best Discount</option>
                    <option value="name" className="text-gray-900 bg-white">Name: A-Z</option>
                  </select>
                  <AnimatedButton
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="flex items-center space-x-2 relative"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </AnimatedButton>
                </div>
              </div>

              {/* Expanded Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        >
                          <option value="all">All Categories</option>
                          {dashboardCategories.map(category => (
                            <option key={category} value={category} className="text-gray-900 bg-white">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Rating Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Rating
                        </label>
                        <div className="flex gap-2">
                          {[4, 3, 2, 1].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => toggleRatingFilter(rating)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedFilters.rating === rating
                                  ? 'bg-yellow-400 text-gray-900'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {rating}+ <Star className="w-3 h-3 inline" />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Price Range */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price Range: {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                        </label>
                        <div className="flex gap-4 items-center">
                          <input
                            type="range"
                            min="0"
                            max="50000"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="text-white">-</span>
                          <input
                            type="range"
                            min="0"
                            max="50000"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      {/* Quick Filters */}
                      <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quick Filters
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => toggleBooleanFilter('inStock')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              selectedFilters.inStock
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <Package className="w-4 h-4" />
                            In Stock
                          </button>
                          <button
                            onClick={() => toggleBooleanFilter('onSale')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              selectedFilters.onSale
                                ? 'bg-pink-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <Percent className="w-4 h-4" />
                            On Sale
                          </button>
                          <button
                            onClick={() => toggleBooleanFilter('newArrivals')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              selectedFilters.newArrivals
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                            New Arrivals
                          </button>
                        </div>
                      </div>
                      
                      {/* Active Filters & Reset */}
                      <div className="lg:col-span-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeFilterCount > 0 && (
                            <span className="text-sm text-gray-600">
                              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <AnimatedButton
                          onClick={clearAllFilters}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Clear All Filters
                        </AnimatedButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Products Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  All Products ({sortedProducts.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/80">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border bg-white/10 border-white/20 text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="featured" className="text-gray-900 bg-white">Featured</option>
                    <option value="trending" className="text-gray-900 bg-white">Trending</option>
                    <option value="price-low" className="text-gray-900 bg-white">Price: Low to High</option>
                    <option value="price-high" className="text-gray-900 bg-white">Price: High to Low</option>
                    <option value="rating" className="text-gray-900 bg-white">Highest Rated</option>
                    <option value="discount" className="text-gray-900 bg-white">Best Discount</option>
                    <option value="name" className="text-gray-900 bg-white">Name: A-Z</option>
                  </select>
                </div>
              </div>
              
              {sortedProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Package className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                  <p className="text-white/70 mb-4">Try adjusting your filters or search terms</p>
                  <AnimatedButton
                    onClick={() => {
                      setSearchTerm('')
                      setPriceRange({ min: 0, max: 50000 })
                      setSelectedCategory('all')
                      setSortBy('featured')
                    }}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                  >
                    Clear Filters
                  </AnimatedButton>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative"
                >
                  <GlassCard className="overflow-hidden" variant="light">
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getProductPlaceholder(product)
                        }}
                      />

                      {/* Discount Badge */}
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{product.discount}%
                        </div>
                      )}

                      {/* Stock Status Badge */}
                      {product.stock_status !== 'in_stock' && (
                        <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Out of Stock
                        </div>
                      )}
                      {product.stock_status === 'low_stock' && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Only {product.stock_quantity} left
                        </div>
                      )}

                      {/* Like Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLikeProduct(product.id)}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isInWishlist(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-gray-800 hover:bg-white'
                          }`}
                        disabled={product.stock_status !== 'in_stock'}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </motion.button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Dealer Information */}
                      {product.dealer_info && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-1 ${product.dealer_info.is_verified
                              ? 'bg-green-400'
                              : 'bg-gray-400'
                              }`} />
                            <span className="text-xs text-gray-600">
                              {product.dealer_info.business_name}
                              {product.dealer_info.is_verified && ' ✓'}
                            </span>
                          </div>
                        </div>
                      )}

                      <h3 className="font-semibold text-lg mb-2 text-gray-900">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(product.rating || 4.5)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {Number(product.rating ?? 4.5).toFixed(1)} ({product.reviews || 0})
                        </span>
                      </div>

                      {/* Stock Status & Availability */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${(!product.is_active || (product.stock_status && product.stock_status !== 'in_stock'))
                            ? 'bg-gray-600 text-white'
                            : 'bg-green-500 text-white'
                            }`}>
                            {(!product.is_active || (product.stock_status && product.stock_status !== 'in_stock'))
                              ? 'Out of Stock'
                              : 'In Stock'
                            }
                          </span>
                          {product.is_available_from_dealer && (
                            <span className="text-xs text-gray-600">
                              ✓ Available from dealer
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            {formatPrice(
                              product.discount > 0
                                ? product.price * (1 - product.discount / 100)
                                : product.price
                            )}
                          </span>
                          {product.discount > 0 && (
                            <span className="text-sm line-through text-gray-500 ml-2">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <AnimatedButton
                          onClick={() => handleViewProduct(product)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={() => handleAddToCart(product.id)}
                          size="sm"
                          className="flex-1"
                          disabled={!product.is_active || (product.stock_status && product.stock_status !== 'in_stock')}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          {(!product.is_active || (product.stock_status && product.stock_status !== 'in_stock')) ? 'Out of Stock' : 'Add to Cart'}
                        </AnimatedButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.main>
        
        {/* Product Modal */}
        <ProductModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onAddToCart={handleAddToCart}
        />
      </div>
    </AnimatedBackground>
  )
}

export default EnhancedCustomerDashboard
