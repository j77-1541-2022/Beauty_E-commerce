import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  ShoppingCart,
  Star,
  Share2,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  X,
  ZoomIn,
  Package,
  Award,
  Sparkles
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { productsAPI } from '../services/apiClient'
import { cartAPI } from '../services/cartAPI'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedBackground from '../components/AnimatedBackground'
import BeautyLogo from '../components/BeautyLogo'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import ProductReviews from '../components/ProductReviews'
import { getProductPlaceholder } from '../utils/productImage'

const ProductDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useCustomerAuth()
  const { isDark } = useTheme()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [addedToCart, setAddedToCart] = useState(false)
  const [stockLevel, setStockLevel] = useState(0)

  useEffect(() => {
    fetchProduct()
    fetchRelatedProducts()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      // Mock product data - replace with actual API call
      const mockProduct = {
        id: parseInt(id),
        name: 'Rose Gold Serum',
        price: 89.99,
        originalPrice: 129.99,
        description: 'Experience the luxury of our Rose Gold Serum, a revolutionary skincare product infused with 24K gold particles and vitamin C. This advanced formula penetrates deep into your skin, delivering powerful antioxidants and nutrients for a radiant, youthful glow.',
        features: [
          '24K Gold Particles for luxury and efficacy',
          'Vitamin C for brightening and anti-aging',
          'Hyaluronic Acid for deep hydration',
          'Peptides for collagen production',
          'Natural botanical extracts',
          'Dermatologist tested and approved'
        ],
        images: [
          '/images/placeholders/treatment.svg',
          '/images/placeholders/skincare.svg',
          '/images/placeholders/treatment.svg',
          '/images/placeholders/skincare.svg'
        ],
        category: 'skincare',
        brand: 'Glow Beyond Beauty',
        rating: 4.8,
        reviews: 124,
        inStock: true,
        stock: 15,
        lowStockThreshold: 5,
        discount: 30,
        tags: ['luxury', 'anti-aging', 'brightening', 'hydration'],
        specifications: {
          'Size': '30ml',
          'Skin Type': 'All skin types',
          'Usage': 'Morning and evening',
          'Shelf Life': '24 months',
          'Ingredients': 'Gold particles, Vitamin C, Hyaluronic Acid, Peptides, Natural extracts'
        }
      }
      setProduct(mockProduct)
      setStockLevel(mockProduct.stock)
    } catch (error) {
      console.error('Failed to fetch product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async () => {
    try {
      // Mock related products
      const mockRelated = [
        {
          id: 2,
          name: 'Diamond Cream',
          price: 129.99,
          image: '/images/placeholders/skincare.svg',
          product_type: 'skincare',
          rating: 4.9,
          discount: 15
        },
        {
          id: 3,
          name: 'Pearl Mask Set',
          price: 59.99,
          image: '/images/placeholders/treatment.svg',
          product_type: 'treatment',
          rating: 4.7,
          discount: 10
        },
        {
          id: 4,
          name: 'Sapphire Eye Cream',
          price: 79.99,
          image: '/images/placeholders/skincare.svg',
          product_type: 'skincare',
          rating: 4.6,
          discount: 25
        }
      ]
      setRelatedProducts(mockRelated)
    } catch (error) {
      console.error('Failed to fetch related products:', error)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', `/product/${id}`)
      navigate('/register')
      return
    }

    try {
      await cartAPI.addItem(product.id, quantity)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 3000)
      setStockLevel(prev => Math.max(0, prev - quantity))
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      })
    }
  }

  if (loading) {
    return (
      <AnimatedBackground variant="ocean">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AnimatedBackground>
    )
  }

  if (!product) {
    return (
      <AnimatedBackground variant="ocean">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Product Not Found</h1>
            <Link to="/shop" className="text-purple-300 hover:text-white">Continue Shopping</Link>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground variant="ocean">
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/shop" className="flex items-center text-white hover:text-purple-200 transition-colors">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Shop
              </Link>
              <BeautyLogo size="medium" animated={true} />
              <div className="flex items-center space-x-4">
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="relative">
                <div
                  className="relative h-96 bg-white rounded-2xl overflow-hidden cursor-zoom-in"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setShowZoom(true)}
                  onMouseLeave={() => setShowZoom(false)}
                >
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = getProductPlaceholder(product)
                    }}
                  />

                  {/* Zoom Overlay */}
                  <AnimatePresence>
                    {showZoom && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url(${product.images[selectedImage]})`,
                          backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          backgroundSize: '200%'
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{product.discount}%
                    </div>
                  )}

                  {/* Stock Indicator */}
                  <div className="absolute bottom-4 left-4">
                    {stockLevel === 0 ? (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Out of Stock
                      </span>
                    ) : stockLevel <= product.lowStockThreshold ? (
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        Only {stockLevel} left
                      </span>
                    ) : (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        In Stock ({stockLevel})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-purple-500' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getProductPlaceholder(product)
                      }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Product Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                    <p className="text-purple-200">{product.brand}</p>
                  </div>
                  <button
                    onClick={handleLike}
                    className={`p-3 rounded-full transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-400'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-white">{product.rating}</span>
                  <span className="text-purple-200">({product.reviews} reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline space-x-3 mb-6">
                  <span className="text-3xl font-bold text-white">
                    ${product.discount > 0
                      ? (product.price * (1 - product.discount / 100)).toFixed(2)
                      : product.price
                    }
                  </span>
                  {product.discount > 0 && (
                    <>
                      <span className="text-xl text-purple-300 line-through">
                        ${product.originalPrice}
                      </span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        Save ${(product.originalPrice - product.price).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Description</h3>
                <p className="text-purple-200 leading-relaxed">{product.description}</p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start space-x-3 text-purple-200"
                    >
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="bg-white/10 rounded-lg p-3">
                      <p className="text-purple-300 text-sm">{key}</p>
                      <p className="text-white font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-white font-medium">Quantity:</span>
                  <div className="flex items-center bg-white/20 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-white/20 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="px-4 py-2 text-white font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(stockLevel, quantity + 1))}
                      className="p-2 hover:bg-white/20 transition-colors"
                      disabled={stockLevel === 0}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <AnimatedButton
                  onClick={handleAddToCart}
                  disabled={stockLevel === 0}
                  className={`w-full py-4 text-lg font-semibold ${addedToCart ? 'bg-green-500' : ''
                    }`}
                  glow
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Added to Cart!
                    </>
                  ) : stockLevel === 0 ? (
                    <>
                      <X className="w-5 h-5 mr-2" />
                      Out of Stock
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart - ${((product.price * (1 - product.discount / 100)) * quantity).toFixed(2)}
                    </>
                  )}
                </AnimatedButton>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Truck className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-purple-200">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-purple-200">Secure Payment</p>
                </div>
                <div className="text-center">
                  <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-purple-200">Quality Guaranteed</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Product Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <ProductReviews productId={id} />
          </motion.div>

          {/* Related Products */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-white mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -5 }}
                >
                  <GlassCard className="overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getProductPlaceholder(relatedProduct)
                        }}
                      />
                      {relatedProduct.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{relatedProduct.discount}%
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2">{relatedProduct.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">
                          ${relatedProduct.discount > 0
                            ? (relatedProduct.price * (1 - relatedProduct.discount / 100)).toFixed(2)
                            : relatedProduct.price
                          }
                        </span>
                        <Link
                          to={`/product/${relatedProduct.id}`}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.main>
      </div>
    </AnimatedBackground>
  )
}

export default ProductDetailsPage
