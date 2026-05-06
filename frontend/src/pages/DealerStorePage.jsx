import { getProductPlaceholder, resolveProductImage } from '../utils/productImage'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Shield,
  Package,
  TrendingUp,
  ShoppingBag,
  Heart,
  Scale
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCompare } from '../contexts/CompareContext'
import { useCart } from '../contexts/CartContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import LoadingSpinner from '../components/LoadingSpinner'
import { productAPI } from '../services/apiClient'
import 'leaflet/dist/leaflet.css'

const markerIcon = new L.Icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = markerIcon

const DealerStorePage = () => {
  const { dealerId } = useParams()
  const { colors, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCompare, removeFromCompare, isInCompare } = useCompare()
  const { addToCart } = useCart()
  const isDark = theme === 'dark'
  
  const [dealer, setDealer] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    fetchDealerData()
  }, [dealerId])

  const fetchDealerData = async () => {
    try {
      setLoading(true)
      const response = await productAPI.getAll({ dealer_id: dealerId, is_active: true })
      const payload = response?.data
      const liveProducts = Array.isArray(payload)
        ? payload
        : payload?.results || payload?.data || []

      const firstProduct = liveProducts[0]
      const dealerName = firstProduct?.dealer_business_name || firstProduct?.dealer_info?.business_name || `Dealer ${dealerId}`

      setProducts(liveProducts)
      setDealer({
        id: dealerId,
        business_name: dealerName,
        description: `Products available from ${dealerName}.`,
        location: firstProduct?.dealer_info?.location || 'Nairobi, Kenya',
        phone: firstProduct?.dealer_info?.whatsapp_number || '',
        email: firstProduct?.dealer_info?.business_email || '',
        rating: 0,
        total_reviews: 0,
        is_verified: firstProduct?.dealer_info?.is_verified ?? true,
        member_since: '2023',
        total_products: liveProducts.length,
        total_sales: 0,
        business_hours: 'Mon-Sat: 9AM - 8PM',
        latitude: -1.286389,
        longitude: 36.817223,
        image: '/images/beauty.jpg'
      })
      setRating(0)
    } catch (error) {
      console.error('Failed to fetch dealer data:', error)
      setDealer(null)
      setProducts([])
      setRating(0)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    addToCart(product)
  }

  const handleToggleWishlist = (product) => {
    toggleWishlist(product)
  }

  const handleToggleCompare = (product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
    } else {
      addToCompare(product)
    }
  }

  const visibleBrands = products.reduce((accumulator, product) => {
    const brandName = product.brand_name || product.brand
    if (!brandName || accumulator.some((brand) => brand.name === brandName)) {
      return accumulator
    }

    accumulator.push({
      id: brandName,
      name: brandName,
      category: product.category_name || 'Beauty'
    })
    return accumulator
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!dealer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center ${colors.text}`}>
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Store not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50'} p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Store Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <img
                  src={dealer.image}
                  alt={dealer.business_name}
                  className="w-full h-64 md:h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/beauty1.jpg'
                  }}
                />
              </div>
              <div className="md:w-2/3 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className={`text-3xl font-bold ${colors.text}`}>
                        {dealer.business_name}
                      </h1>
                      {dealer.is_verified && (
                        <CheckCircle className="w-6 h-6 text-blue-500" title="Verified Dealer" />
                      )}
                    </div>
                    <p className={`${colors.textMuted} mb-4`}>{dealer.description}</p>
                  </div>
                  <AnimatedButton>
                    Follow Store
                  </AnimatedButton>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className={`font-semibold ${colors.text}`}>{dealer.rating}</span>
                    </div>
                    <p className={`text-xs ${colors.textMuted}`}>{dealer.total_reviews} reviews</p>
                  </div>
                  <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                    <Package className="w-4 h-4 text-purple-500 mb-1" />
                    <p className={`font-semibold ${colors.text}`}>{dealer.total_products}</p>
                    <p className={`text-xs ${colors.textMuted}`}>Products</p>
                  </div>
                  <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                    <TrendingUp className="w-4 h-4 text-green-500 mb-1" />
                    <p className={`font-semibold ${colors.text}`}>{dealer.total_sales}</p>
                    <p className={`text-xs ${colors.textMuted}`}>Sales</p>
                  </div>
                  <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
                    <Clock className="w-4 h-4 text-blue-500 mb-1" />
                    <p className={`font-semibold ${colors.text}`}>Since {dealer.member_since}</p>
                    <p className={`text-xs ${colors.textMuted}`}>Joined</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-center gap-2 ${colors.textMuted}`}>
                    <MapPin className="w-4 h-4" />
                    <span>{dealer.location}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${colors.textMuted}`}>
                    <Phone className="w-4 h-4" />
                    <span>{dealer.phone}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${colors.textMuted}`}>
                    <Mail className="w-4 h-4" />
                    <span>{dealer.email}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${colors.textMuted}`}>
                    <Clock className="w-4 h-4" />
                    <span>{dealer.business_hours}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className={`text-lg font-semibold ${colors.text} mb-3`}>Store Location</h3>
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    <MapContainer
                      center={[dealer.latitude || -1.286389, dealer.longitude || 36.817223]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: '280px', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[dealer.latitude || -1.286389, dealer.longitude || 36.817223]}>
                        <Popup>
                          <strong>{dealer.business_name}</strong><br />
                          {dealer.location}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Brands Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${colors.text}`}>Brands in this store</h2>
            <p className={`${colors.textMuted}`}>{brands.length} brands featured</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleBrands.map((brand) => (
              <GlassCard key={brand.id} className="p-4 text-center" hover>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white font-bold">
                  {brand.name
                    .split(' ')
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <h3 className={`font-semibold ${colors.text} text-sm`}>{brand.name}</h3>
                <p className={`text-xs ${colors.textMuted} mt-1`}>{brand.category}</p>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${colors.text}`}>
              Products from {dealer.business_name}
            </h2>
            <p className={`${colors.textMuted}`}>
              {products.length} products available
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
              >
                <GlassCard className="overflow-hidden" hover>
                  <div className="relative">
                    <img
                      src={resolveProductImage(product)}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = getProductPlaceholder(product)
                      }}
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleWishlist(product)}
                        className={`p-2 rounded-lg shadow-lg transition-all ${
                          isInWishlist(product.id)
                            ? 'bg-red-500 text-white'
                            : `${colors.card} ${colors.text} hover:scale-105`
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleToggleCompare(product)}
                        className={`p-2 rounded-lg shadow-lg transition-all ${
                          isInCompare(product.id)
                            ? 'bg-blue-500 text-white'
                            : `${colors.card} ${colors.text} hover:scale-105`
                        }`}
                      >
                        <Scale className={`w-4 h-4 ${isInCompare(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className={`font-semibold ${colors.text} mb-2`}>{product.name}</h3>
                    <p className={`text-xs ${colors.textMuted} mb-2`}>{product.brand_name || product.brand || 'Unknown brand'}</p>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className={`text-sm ${colors.textMuted}`}>{product.rating ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-lg font-bold ${colors.accent}`}>
                        {formatPrice(product.selling_price ?? product.price ?? 0)}
                      </p>
                      <p className={`text-xs ${product.stock_quantity > 5 ? 'text-green-500' : product.stock_quantity > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                      </p>
                    </div>
                    <AnimatedButton
                      onClick={() => handleAddToCart(product)}
                      disabled={(product.stock_quantity ?? 0) === 0}
                      className="w-full"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Add to Cart
                    </AnimatedButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Package className={`w-16 h-16 mx-auto ${colors.textMuted} mb-4 opacity-50`} />
            <p className={colors.textMuted}>No products available from this store yet</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default DealerStorePage
