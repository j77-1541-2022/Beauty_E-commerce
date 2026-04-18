import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Star,
  Heart,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  ShoppingCart,
  AlertCircle,
  MessageCircle,
  Mail,
  MapPin,
  Scale
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useCompare } from '../contexts/CompareContext'
import inventoryAPI from '../services/inventoryAPI'
import { cartAPI } from '../services/cartAPI'
import { wishlistAPI } from '../services/wishlistAPI'
import shopAPI from '../services/shopAPI'
import LoadingSpinner from '../components/LoadingSpinner'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import SkeletonLoader from '../components/SkeletonLoader'
import LuxuryBackground from '../components/LuxuryBackground'
import BeautyLogo from '../components/BeautyLogo'
import CurrencySelector from '../components/CurrencySelector'
import ProductModal from '../components/ProductModal'
import CompareModal from '../components/CompareModal'
import Footer from '../components/Footer'
import { getProductPlaceholder, resolveProductImage } from '../utils/productImage'

const ShopPage = () => {
  const normalizeCategoryKey = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]/g, '')

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useCustomerAuth()
  const { showNotification } = useNotification()
  const { currentTheme, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const { isInWishlist, toggleWishlist, getWishlistCount } = useWishlist()
  const { addToCart, getCartItems, getCartTotal, clearCart, getCartCount, refreshCart } = useCart()
  const { addToCompare, removeFromCompare, isInCompare, getCompareCount } = useCompare()
  const [showCompareModal, setShowCompareModal] = useState(false)

  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)

  // Fetch products and categories
  useEffect(() => {
    fetchProducts()
    fetchCategories()
    
    // Initialize real-time updates
    shopAPI.initializeRealTimeUpdates(handleRealTimeUpdate)
    
    return () => {
      shopAPI.cleanupRealTimeUpdates()
    }
  }, [])

  // Filter products based on category and price only (search is handled by API)
  useEffect(() => {
    let filtered = products

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        normalizeCategoryKey(product.category) === normalizeCategoryKey(selectedCategory) ||
        normalizeCategoryKey(product.category?.slug) === normalizeCategoryKey(selectedCategory) ||
        normalizeCategoryKey(product.category?.name) === normalizeCategoryKey(selectedCategory)
      )
    }

    // Price filter
    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    )

    // Sort products
    filtered = sortProducts(filtered, sortBy)

    setFilteredProducts(filtered)
  }, [products, selectedCategory, priceRange, sortBy])

  useEffect(() => {
    if (!location.hash) return

    const id = location.hash.replace('#', '')
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Fetch only available products from admin inventory (same as dashboard)
      const productsResponse = await inventoryAPI.getAvailableProducts({
        customer_view: true,
        include_inventory_status: true,
        include_dealer_info: true,
        is_active: true
      })
      
      const productsData = Array.isArray(productsResponse) ? productsResponse : productsResponse.results || []

      if (productsData && productsData.length > 0) {
        console.log('✅ Products fetched from admin inventory:', productsData.length)
        
        // Process products to ensure consistency with dashboard
        const processedProducts = productsData.map(product => ({
          categoryName: product.category_name || product.category?.name || product.category || 'uncategorized',
          categorySlug: normalizeCategoryKey(product.category_name || product.category?.name || product.category || 'uncategorized'),
          id: product.id,
          name: product.name || product.product_name,
          description: product.description || product.product_description || '',
          price: product.price || product.selling_price || 0,
          original_price: product.original_price,
          discount: product.discount || 0,
          category: product.category_name || product.category?.name || product.category || 'uncategorized',
          rating: product.rating || 4,
          reviews: product.reviews || 0,
          // Only use dealer-uploaded image if available, otherwise null
          image: resolveProductImage(product),
          is_active: product.is_active !== false,
          stock_quantity: product.stock_quantity || 0,
          stock_status: product.stock_status || 'out_of_stock',
          low_stock_threshold: product.low_stock_threshold || 5,
          // Expiry tracking
          expiry_date: product.expiry_date,
          expiry_status: product.expiry_status,
          batch_number: product.batch_number,
          manufactured_date: product.manufactured_date,
          // Enhanced dealer info with contact details
          dealer_info: product.dealer_info || {
            business_name: product.dealer_name || product.dealer?.business_name || 'Beauty Store',
            is_verified: product.dealer_verified !== false,
            business_phone: product.dealer?.business_phone || product.dealer?.user?.phone || '',
            whatsapp_number: product.dealer?.whatsapp_number || product.dealer?.business_phone || '',
            business_email: product.dealer?.business_email || product.dealer?.user?.email || '',
            location: product.dealer?.location || product.dealer?.city || '',
            full_address: product.dealer?.full_address || '',
            whatsapp_link: product.dealer?.whatsapp_link || '',
            email_link: product.dealer?.email_link || ''
          },
          brand: product.brand || 'Beauty Brand',
          sku: product.sku || `SKU-${product.id}`,
          weight: product.weight || 0,
          features: product.features || [],
          last_inventory_update: product.last_stock_update || new Date().toISOString()
        }))
        
        setProducts(
          processedProducts.map((product) => ({
            ...product,
            category: {
              name: product.categoryName,
              slug: product.categorySlug
            }
          }))
        )
      } else {
        console.log('ℹ️ No in-stock products found in inventory')
        setProducts([])
      }

    } catch (error) {
      console.error('❌ Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesData = await shopAPI.getCategories()
      console.log('✅ Categories fetched:', categoriesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Set default categories on error
      const defaultCategories = [
        { id: 'skincare', name: 'skincare', display_name: 'Skincare', slug: 'skincare' },
        { id: 'makeup', name: 'makeup', display_name: 'Makeup', slug: 'makeup' },
        { id: 'bodycare', name: 'bodycare', display_name: 'Body Care', slug: 'bodycare' },
        { id: 'haircare', name: 'haircare', display_name: 'Hair Care', slug: 'haircare' },
        { id: 'treatment', name: 'treatment', display_name: 'Treatment', slug: 'treatment' },
        { id: 'fragrance', name: 'fragrance', display_name: 'Fragrance', slug: 'fragrance' }
      ]
      setCategories(defaultCategories)
    }
  }

  // Handle real-time updates from WebSocket
  const handleRealTimeUpdate = useCallback((data) => {
    console.log('🔄 Real-time update received:', data)
    
    if (data.type === 'inventory_update' || data.type === 'stock_update') {
      // Update product stock quantity
      setProducts(prevProducts => 
        prevProducts.map(product => {
          if (product.id === data.product_id) {
            const updatedProduct = {
              ...product,
              stock_quantity: data.quantity || product.stock_quantity,
              stock_status: shopAPI.getStockStatus({
                ...product,
                stock_quantity: data.quantity || product.stock_quantity
              })
            }
            
            // Remove from list if out of stock
            if (updatedProduct.stock_quantity <= 0) {
              return null
            }
            
            return updatedProduct
          }
          return product
        }).filter(Boolean) // Remove null values
      )
    } else if (data.type === 'product_update') {
      // Handle product updates
      if (data.action === 'created' || data.action === 'updated') {
        if (data.product.is_active && data.product.stock_quantity > 0) {
          setProducts(prevProducts => {
            const existingIndex = prevProducts.findIndex(p => p.id === data.product.id)
            if (existingIndex >= 0) {
              const updatedProducts = [...prevProducts]
              updatedProducts[existingIndex] = {
                ...data.product,
                stock_status: shopAPI.getStockStatus(data.product)
              }
              return updatedProducts
            } else {
              return [...prevProducts, {
                ...data.product,
                stock_status: shopAPI.getStockStatus(data.product)
              }]
            }
          })
        }
      } else if (data.action === 'deleted') {
        setProducts(prevProducts => 
          prevProducts.filter(product => product.id !== data.product_id)
        )
      }
    }
  }, [])

  // Handle category change locally to keep browse interactions instant and reliable
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
  }

  // Handle search input change (just updates state, no API call)
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle search submit (triggers API call)
  const handleSearchSubmit = useCallback(async () => {
    const trimmedTerm = searchTerm?.trim() || ''
    if (trimmedTerm === '') {
      fetchProducts()
      return
    }

    if (trimmedTerm.length < 2) {
      showNotification('Please enter at least 2 characters to search', 'info')
      return
    }

    try {
      setLoading(true)
      const response = await shopAPI.searchProducts(trimmedTerm)
      const searchResults = response.results || response
      setProducts(searchResults)
    } catch (error) {
      console.error('❌ Failed to search products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  // Debounced search effect - only triggers after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        handleSearchSubmit()
      } else if (searchTerm === '' && products.length === 0) {
        fetchProducts()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, handleSearchSubmit])

  const sortProducts = (products, sortBy) => {
    const sorted = [...products]

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price)
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      case 'featured':
      default:
        return sorted.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
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
      } else {
        showNotification('Failed to add to cart', 'error')
      }

      if (!user) {
        // Keep guests on shop page and allow checkout only after login
        localStorage.setItem('redirectAfterLogin', '/shop')
      }
    } catch (error) {
      console.error('❌ Failed to add to cart:', error)
      showNotification('Failed to add product to cart', 'error')
    }
  }

  const handleCheckout = async () => {
    if (!user) {
      navigate('/register')
      return
    }

    try {
      // Get cart items
      const cartItems = getCartItems()
      if (cartItems.length === 0) {
        console.log('Cart is empty')
        return
      }

      // Create order data
      const orderData = {
        customer_id: user.id,
        customer_email: user.email,
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total_price: item.price * item.quantity
        })),
        total_amount: getCartTotal(),
        status: 'pending',
        payment_status: 'pending',
        currency: 'KSH'
      }

      // Create order
      const order = await orderAPI.createOrder(orderData)

      if (order) {
        console.log('Order created successfully:', order.id)
        // Clear cart after successful order
        await clearCart()
        // Navigate to order confirmation or orders page
        navigate('/orders')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  const handleViewProduct = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleToggleWishlist = async (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      localStorage.setItem('redirectAfterLogin', '/shop')
      navigate('/register')
      return
    }

    try {
      if (isInWishlist(product.id)) {
        // Try to remove from backend wishlist
        try {
          const result = await wishlistAPI.removeFromWishlist(product.id)
          if (result.success) {
            toggleWishlist(product)
            showNotification('Removed from wishlist', 'info')
          }
        } catch (error) {
          // Fallback to local wishlist
          toggleWishlist(product)
          showNotification('Removed from wishlist', 'info')
        }
      } else {
        // Try to add to backend wishlist
        try {
          const result = await wishlistAPI.addToWishlist(product.id)
          if (result.success) {
            toggleWishlist(product)
            showNotification('Added to wishlist!', 'success')
          }
        } catch (error) {
          // Fallback to local wishlist
          toggleWishlist(product)
          showNotification('Added to wishlist!', 'success')
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error)
      showNotification('Failed to update wishlist', 'error')
    }
  }

  const ProductCard = ({ product }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative"
    >
      <div className={`${currentTheme.card} ${currentTheme.cardBorder} border rounded-2xl ${currentTheme.shadow} overflow-hidden transition-all hover:shadow-xl`}>
        {/* Product Image */}
        <div className={`relative h-64 ${currentTheme.background}`}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.src = getProductPlaceholder(product)
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <span>No Image</span>
            </div>
          )}

          {/* Stock Status Badge - Only show if needed */}
          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              Only {product.stock_quantity} left
            </div>
          )}

          {/* Discount Badge */}
          {product.discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              -{product.discount}%
            </div>
          )}

          {/* Wishlist Badge */}
          {isInWishlist(product.id) && (
            <div className="absolute top-12 right-2 bg-red-500 text-white p-2 rounded-full">
              <Heart className="w-4 h-4 fill-current" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-2 left-2 right-2 flex space-x-2">
            <button
              onClick={() => handleViewProduct(product)}
              className={`flex-1 ${currentTheme.card} ${currentTheme.text} px-3 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all flex items-center justify-center shadow-lg`}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </button>
            <button
              onClick={() => handleToggleWishlist(product)}
              className={`p-2 rounded-lg shadow-lg transition-all ${isInWishlist(product.id)
                ? 'bg-red-500 text-white'
                : `${currentTheme.card} ${currentTheme.text} hover:scale-105`
                }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
              className={`p-2 rounded-lg shadow-lg transition-all ${isInCompare(product.id)
                ? 'bg-blue-500 text-white'
                : `${currentTheme.card} ${currentTheme.text} hover:scale-105`
                }`}
              title={isInCompare(product.id) ? 'Remove from compare' : 'Add to compare'}
            >
              <Scale className={`w-4 h-4 ${isInCompare(product.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Expiry Date Warning */}
          {product.expiry_date && (
            <div className={`flex items-center space-x-2 mb-2 px-2 py-1 rounded-lg text-xs ${
              product.expiry_status === 'expired' ? 'bg-red-100 text-red-700' :
              product.expiry_status === 'critical' ? 'bg-red-50 text-red-600' :
              product.expiry_status === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-green-50 text-green-600'
            }`}>
              <AlertCircle className="w-3 h-3" />
              <span>
                {product.expiry_status === 'expired' ? 'Expired' :
                 product.expiry_status === 'critical' ? 'Expires in < 30 days' :
                 product.expiry_status === 'warning' ? 'Expires in < 3 months' :
                 `Exp: ${new Date(product.expiry_date).toLocaleDateString()}`}
              </span>
            </div>
          )}

          <h3 className={`font-semibold text-lg mb-2 ${currentTheme.text}`}>
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating || 4.5)
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className={`text-sm ${currentTheme.textMuted}`}>
              {Number(product.rating ?? 4.5).toFixed(1)} ({product.reviews || 0})
            </span>
          </div>

          {/* Stock Status - Only show for in-stock products */}
          {product.is_active && product.stock_quantity > 0 && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentTheme.success}`}>
                  In Stock
                </span>
                {product.stock_quantity <= 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Only {product.stock_quantity} left
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Batch Number */}
          {product.batch_number && (
            <div className="text-xs text-gray-500 mb-2">
              Batch: {product.batch_number}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className={`text-2xl font-bold ${currentTheme.accent}`}>
                {formatPrice(
                  product.discount > 0
                    ? product.price * (1 - product.discount / 100)
                    : product.price
                )}
              </span>
              {product.discount > 0 && (
                <span className={`text-sm line-through ${currentTheme.textMuted} ml-2`}>
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => handleAddToCart(product.id)}
            className={`w-full ${currentTheme.button} py-2 rounded-lg font-medium ${currentTheme.primaryHover} transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mb-4`}
            disabled={!product.is_active || product.stock_quantity <= 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.is_active && product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>

          {/* Dealer Contact Section - At Bottom of Card */}
          {product.dealer_info && (
            <div className={`border-t pt-3 mt-2 ${currentTheme.border || 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${product.dealer_info.is_verified ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={`text-xs font-medium ${currentTheme.text}`}>
                    {product.dealer_info.business_name}
                  </span>
                  {product.dealer_info.is_verified && (
                    <span className="text-xs text-green-600">✓ Verified</span>
                  )}
                </div>
              </div>
              
              {/* Dealer Location */}
              {product.dealer_info.location && (
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  {product.dealer_info.location}
                </div>
              )}
              
              {/* Contact Buttons */}
              <div className="flex gap-2 mt-2">
                {product.dealer_info.whatsapp_link && (
                  <a
                    href={product.dealer_info.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                )}
                {product.dealer_info.email_link && (
                  <a
                    href={product.dealer_info.email_link}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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
      <div className={`min-h-screen ${currentTheme.background}`}>
        {/* Header */}
        <header className={`${currentTheme.nav} sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/shop" className="flex items-center space-x-2">
                <BeautyLogo size="medium" animated={true} />
                <span className={`${currentTheme.text} font-bold text-xl`}>Beauty Shop</span>
              </Link>

              <div className="flex items-center space-x-4">
                <CurrencySelector />
                <Link to="/cart" className={`relative p-2 rounded-lg ${currentTheme.link} hover:bg-black/5 transition-colors`}>
                  <ShoppingCart className={`w-5 h-5 ${currentTheme.text}`} />
                  <span className={`absolute -top-1 -right-1 ${currentTheme.button} text-xs rounded-full w-5 h-5 flex items-center justify-center`}>
                    {getCartCount()}
                  </span>
                </Link>
                <Link to="/wishlist" className={`relative p-2 rounded-lg ${currentTheme.link} hover:bg-black/5 transition-colors`}>
                  <Heart className={`w-5 h-5 ${currentTheme.text}`} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getWishlistCount()}
                  </span>
                </Link>
                {user ? (
                  <Link to="/dashboard" className={currentTheme.link}>
                    Dashboard
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link to="/login" className={currentTheme.link}>
                      Login
                    </Link>
                    <Link to="/register" className={`px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors`}>
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl ${currentTheme.card} ${currentTheme.shadow} mb-8`}
          >
            <div className={`absolute inset-0 ${currentTheme.primary} opacity-10`} />
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className={`text-4xl md:text-5xl font-bold ${currentTheme.text} mb-4`}>
                      Welcome to <span className={`${currentTheme.primary} bg-clip-text text-transparent`}>Glow Beyond</span>
                    </h1>
                    <p className={`text-lg ${currentTheme.textMuted} mb-6`}>
                      Discover premium beauty products from verified dealers across Kenya. 
                      Shop with confidence and earn loyalty points on every purchase.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <AnimatedButton
                        onClick={() => setSelectedCategory('all')}
                        size="lg"
                      >
                        Shop All Products
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => user ? navigate('/dashboard') : navigate('/login')}
                        variant="outline"
                        size="lg"
                      >
                        {user ? 'My Dashboard' : 'Join Now'}
                      </AnimatedButton>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex-shrink-0"
                >
                  <BeautyLogo size="xlarge" animated={true} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Category Quick Links */}
          <motion.div
            id="browse-by-category"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className={`text-2xl font-bold ${currentTheme.text} mb-4`}>Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <motion.button
                  key={category.id || category.slug}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => handleCategoryChange(category.slug || category.name)}
                  className={`p-4 rounded-xl ${currentTheme.card} border ${currentTheme.cardBorder} ${currentTheme.shadow} hover:scale-105 transition-all cursor-pointer text-center`}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${currentTheme.primary} flex items-center justify-center`}>
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <p className={`text-sm font-medium ${currentTheme.text}`}>
                    {category.display_name || category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className={`text-3xl font-bold ${currentTheme.accent} mb-2`}>
              Featured Products
            </h1>
            <p className={`${currentTheme.textMuted}`}>
              Hand-picked selections just for you
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={handleSearchInput}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      className={`w-full pl-10 pr-28 py-3 ${currentTheme.input} rounded-lg ${currentTheme.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center space-x-4">
                <AnimatedButton
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className={`flex items-center space-x-2 ${currentTheme.card} ${currentTheme.text}`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </AnimatedButton>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-3 ${currentTheme.input} rounded-lg ${currentTheme.text} focus:outline-none`}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>

                <div className={`flex ${currentTheme.card} border ${currentTheme.cardBorder} rounded-lg`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-l-lg transition-all ${viewMode === 'grid' ? currentTheme.button : currentTheme.text}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-r-lg transition-all ${viewMode === 'list' ? currentTheme.button : currentTheme.text}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 p-4 ${currentTheme.card} border ${currentTheme.cardBorder} rounded-lg`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.textMuted} mb-2`}>
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className={`w-full px-4 py-2 ${currentTheme.input} rounded-lg ${currentTheme.text} focus:outline-none`}
                      >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                          <option key={category.id || category.slug} value={category.slug || category.name}>
                            {category.display_name || category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.textMuted} mb-2`}>
                        Price Range: {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    {/* Reset Filters */}
                    <div className="flex items-end">
                      <AnimatedButton
                        onClick={() => {
                          setSearchTerm('')
                          setSelectedCategory('all')
                          setPriceRange({ min: 0, max: 50000 })
                          setSortBy('featured')
                          fetchProducts()
                        }}
                        variant="outline"
                        size="sm"
                        className={currentTheme.text}
                      >
                        Reset Filters
                      </AnimatedButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className={currentTheme.textMuted}>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </motion.div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
              }`}>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="max-w-md mx-auto">
                <AlertCircle className={`w-16 h-16 ${currentTheme.accent} mx-auto mb-4`} />
                <h3 className={`text-xl font-semibold ${currentTheme.text} mb-2`}>
                  {selectedCategory !== 'all' ? 'No products found in this category' : 'No products found'}
                </h3>
                <p className={currentTheme.textMuted}>
                  {selectedCategory !== 'all' ? 'Try another category or check back later.' : 'Try adjusting your filters or search terms'}
                </p>
              </div>
            </motion.div>
          )}
        </main>

        {/* Product Modal */}
        <ProductModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onAddToCart={handleAddToCart}
        />

        {/* Compare Modal */}
        <CompareModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
        />

        {/* Floating Compare Button */}
        {getCompareCount() > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCompareModal(true)}
            className={`fixed bottom-24 right-6 z-40 ${colors.primary} text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2`}
          >
            <Scale className="w-5 h-5" />
            <span className="font-semibold">{getCompareCount()}</span>
          </motion.button>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </LuxuryBackground>
  )
}

export default ShopPage
