import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Star,
  Heart,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  Truck,
  Award
} from 'lucide-react'
import { productsAPI } from '../services/apiClient'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import LoadingSpinner from '../components/LoadingSpinner'
import Footer from '../components/Footer'
import LuxuryBackground from '../components/LuxuryBackground'
import BeautyLogo from '../components/BeautyLogo'
import { getProductPlaceholder, resolveProductImage } from '../utils/productImage'

const HomePage = () => {
  const { isAuthenticated } = useCustomerAuth()
  const { currentTheme, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const heroImages = [
    'https://picsum.photos/seed/luxury-beauty-serum/1920/1080.jpg',
    'https://picsum.photos/seed/premium-skincare-products/1920/1080.jpg',
    'https://picsum.photos/seed/elegant-beauty-cosmetics/1920/1080.jpg',
    'https://picsum.photos/seed/beauty-spa-treatment/1920/1080.jpg'
  ]

  const heroContent = [
    {
      title: "Glow Beyond Beauty",
      tagline: "Discover premium beauty products curated just for you",
      cta: "Shop Now"
    },
    {
      title: "Radiate Confidence",
      tagline: "Transform your skincare routine with our luxury collection",
      cta: "Explore Now"
    },
    {
      title: "Pure Elegance",
      tagline: "Experience the perfect blend of nature and science",
      cta: "Discover More"
    },
    {
      title: "Timeless Beauty",
      tagline: "Unlock your natural radiance with our expert formulas",
      cta: "Start Journey"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll()
      setProducts(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)
  }

  const handleShopNow = () => {
    navigate('/shop')
  }

  if (loading) {
    return (
      <LuxuryBackground theme={theme}>
        <div className={`relative z-10 w-full overflow-hidden ${currentTheme.background}`}>
          {/* HERO SECTION */}
          <div className="relative h-screen w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
              >
                <div className={`absolute inset-0 ${currentTheme.primary} opacity-20`} />
                <motion.img
                  src={heroImages[currentSlide]}
                  alt={`Hero slide ${currentSlide + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 8, ease: "easeOut" }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${currentTheme.card} ${currentTheme.text} p-3 rounded-full ${currentTheme.shadow} hover:scale-110 transition-all z-20`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${currentTheme.card} ${currentTheme.text} p-3 rounded-full ${currentTheme.shadow} hover:scale-110 transition-all z-20`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-3 rounded-full transition-all ${currentSlide === index
                    ? `${currentTheme.button} w-8`
                    : 'bg-white/50 hover:bg-white/75 w-3'
                    }`}
                />
              ))}
            </div>

            {/* Overlay Content */}
            <div className={`absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 flex flex-col justify-center items-center text-white text-center px-4`}>
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="max-w-4xl"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex items-center justify-center mb-6"
                >
                  <BeautyLogo size="xlarge" animated={true} showTagline={false} />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-xl md:text-2xl mb-8 text-white/95 max-w-2xl mx-auto drop-shadow-lg"
                >
                  {heroContent[currentSlide].tagline}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 items-center justify-center"
                >
                  <motion.button
                    onClick={handleShopNow}
                    className={`group ${currentTheme.button} px-8 py-4 rounded-full font-semibold text-lg ${currentTheme.primaryHover} transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{heroContent[currentSlide].cta}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <Link
                    to="/register"
                    className={`${currentTheme.card} ${currentTheme.text} px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all border-2 border-white/30 hover:border-white/50 shadow-lg`}
                  >
                    Join Now
                  </Link>
                </motion.div>

                <div className="mt-4 text-sm text-white/80">
                  <Link to="/register?role=dealer" className="underline hover:text-white">Become a Verified Dealer</Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Loading Products Section */}
          <div className={`py-20 ${currentTheme.background}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className={`text-4xl font-bold ${currentTheme.accent} mb-4`}>
                  Featured Products
                </h2>
                <p className={`${currentTheme.textMuted} text-lg max-w-2xl mx-auto`}>
                  Loading our premium beauty products...
                </p>
              </motion.div>

              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </LuxuryBackground>
    )
  }

  return (
    <LuxuryBackground theme={theme}>
      <div className={`relative z-10 w-full overflow-hidden ${currentTheme.background}`}>
        {/* HERO SECTION */}
        <div className="relative h-screen w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              <div className={`absolute inset-0 ${currentTheme.primary} opacity-20`} />
              <motion.img
                src={heroImages[currentSlide]}
                alt={`Hero slide ${currentSlide + 1}`}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: "easeOut" }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${currentTheme.card} ${currentTheme.text} p-3 rounded-full ${currentTheme.shadow} hover:scale-110 transition-all z-20`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${currentTheme.card} ${currentTheme.text} p-3 rounded-full ${currentTheme.shadow} hover:scale-110 transition-all z-20`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full transition-all ${currentSlide === index
                  ? `${currentTheme.button} w-8`
                  : 'bg-white/50 hover:bg-white/75 w-3'
                  }`}
              />
            ))}
          </div>

          {/* Overlay Content */}
          <div className={`absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 flex flex-col justify-center items-center text-white text-center px-4`}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-4xl"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center justify-center mb-6"
              >
                <BeautyLogo size="xlarge" animated={true} showTagline={false} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl md:text-2xl mb-8 text-white/95 max-w-2xl mx-auto drop-shadow-lg"
              >
                {heroContent[currentSlide].tagline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 items-center justify-center"
              >
                <motion.button
                  onClick={handleShopNow}
                  className={`group ${currentTheme.button} px-8 py-4 rounded-full font-semibold text-lg ${currentTheme.primaryHover} transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{heroContent[currentSlide].cta}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <Link
                  to="/register"
                  className={`${currentTheme.card} ${currentTheme.text} px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all border-2 border-white/30 hover:border-white/50 shadow-lg`}
                >
                  Join Now
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* FEATURED PRODUCTS */}
        <div className={`py-20 ${currentTheme.background}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className={`text-4xl font-bold ${currentTheme.accent} mb-4`}>
                Featured Products
              </h2>
              <p className={`${currentTheme.textMuted} text-lg max-w-2xl mx-auto`}>
                Discover our handpicked selection of premium beauty products
              </p>
            </motion.div>

            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-6"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 30,
                  ease: "linear",
                }}
              >
                {[...products, ...products].map((product, index) => (
                  <motion.div
                    key={`${product.id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className={`min-w-[280px] ${currentTheme.card} ${currentTheme.cardBorder} border rounded-2xl ${currentTheme.shadow} hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={resolveProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = getProductPlaceholder(product)
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-6">
                      <h3 className={`text-lg font-semibold ${currentTheme.text} mb-2 truncate`}>
                        {product.name}
                      </h3>
                      <p className={`text-sm ${currentTheme.textMuted} mb-3 truncate`}>
                        {product.category_name || 'Premium Beauty'}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-2xl font-bold ${currentTheme.accent}`}>
                          {formatPrice(product.selling_price)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className={`text-sm ${currentTheme.textMuted}`}>4.8</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className={`flex-1 ${currentTheme.button} py-2 rounded-lg ${currentTheme.primaryHover} transition-all flex items-center justify-center font-medium`}>
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add to Cart
                        </button>
                        <button className={`p-2 border ${currentTheme.cardBorder} rounded-lg hover:bg-gray-50 transition-all`}>
                          <Heart className={`w-4 h-4 ${currentTheme.textMuted}`} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ABOUT/BRAND STORY */}
        <div className={`py-20 ${currentTheme.secondary}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h2 className={`text-4xl font-bold ${currentTheme.accent} mb-6`}>
                Our Story
              </h2>
              <div className={`w-24 h-1 ${currentTheme.primary} mx-auto mb-8 rounded-full`} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`space-y-6 ${currentTheme.textMuted} leading-relaxed text-lg`}
            >
              <p className={currentTheme.text}>
                At Glow Beyond Beauty, we believe that beauty is more than skin deep—it's about confidence,
                self-expression, and celebrating your unique radiance. Founded in 2020, we embarked on a
                mission to curate the world's finest beauty products and make them accessible to everyone.
              </p>

              <p>
                We are committed to delivering high-quality beauty products sourced from trusted brands worldwide.
                Our mission is to empower confidence and elegance through premium skincare, makeup, and haircare solutions
                that not only enhance your natural beauty but also nourish your skin and soul.
              </p>

              <p>
                Every product in our collection is carefully selected for its quality, efficacy, and commitment to
                clean beauty standards. We partner with brands that share our values of sustainability, innovation,
                and inclusivity, ensuring that you receive nothing but the best for your beauty journey.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12"
            >
              <Link
                to="/shop"
                className={`inline-flex items-center space-x-2 ${currentTheme.button} px-8 py-3 rounded-full font-semibold ${currentTheme.primaryHover} transition-all transform hover:scale-105 shadow-lg`}
              >
                <span>Explore Our Collection</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </LuxuryBackground>
  )
}

export default HomePage
