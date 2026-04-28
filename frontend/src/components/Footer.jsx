import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Heart,
  Sparkles,
  ShoppingBag,
  Star
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Footer = () => {
  const { colors, theme } = useTheme()
  const currentYear = new Date().getFullYear()
  const isDark = theme === 'dark'
  const [newsletterEmail, setNewsletterEmail] = useState('')

  const handleNewsletterSubscribe = () => {
    const email = newsletterEmail.trim()
    if (!email) return

    const subject = encodeURIComponent('Newsletter Subscription Request')
    const body = encodeURIComponent(`Please add this email to the Glow Beyond newsletter list: ${email}`)
    window.location.href = `mailto:simonekinyua8@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <footer className={`${isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900' : 'bg-gradient-to-br from-gray-100 via-pink-50 to-purple-50'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className={`w-8 h-8 ${colors.accent}`} />
              <h3 className={`text-2xl font-bold ${colors.primary} bg-clip-text text-transparent`}>
                Glow Beyond Beauty
              </h3>
            </div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
              Discover premium beauty products curated just for you. 
              We believe in empowering confidence and elegance through quality skincare and makeup.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className={`p-2 ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
              >
                <Facebook className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className={`p-2 ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className={`p-2 ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className={`text-lg font-semibold ${colors.accent}`}>Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop#browse-by-category" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Browse by Category
                </Link>
              </li>
              <li>
                <Link to="/shop" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors flex items-center space-x-2`}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop Products</span>
                </Link>
              </li>
              <li>
                <Link to="/info#about-us" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/info#contact" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/info#faq" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/info#beauty-blog" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Beauty Blog
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className={`text-lg font-semibold ${colors.accent}`}>Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/info#customer-service" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Customer Service
                </Link>
              </li>
              <li>
                <Link to="/info#shipping-returns" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/info#size-guide" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Size Guide
                </Link>
              </li>
              <li>
                <Link to="/info#payment-methods" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Payment Methods
                </Link>
              </li>
              <li>
                <Link to="/info#track-order" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/info#customer-reviews" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors flex items-center space-x-2`}>
                  <Star className="w-4 h-4" />
                  <span>Customer Reviews</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className={`text-lg font-semibold ${colors.accent}`}>Get in Touch</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className={`w-5 h-5 ${colors.accent}`} />
                <a href="mailto:simonekinyua8@gmail.com?subject=Glow%20Beyond%20Inquiry" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  info@glowbeyond.co.ke
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className={`w-5 h-5 ${colors.accent}`} />
                <a href="tel:+254712345678" className={`${isDark ? 'text-gray-300 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'} transition-colors`}>
                  +254 712 345 678
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className={`w-5 h-5 ${colors.accent}`} />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Machakos, Kenya
                </span>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h5 className={`text-sm font-semibold ${colors.accent} mb-3`}>Newsletter</h5>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mb-3`}>
                Subscribe for beauty tips and exclusive offers
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleNewsletterSubscribe()
                    }
                  }}
                  className={`flex-1 px-3 py-2 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500'} rounded-lg focus:outline-none transition-colors`}
                />
                <motion.button
                  type="button"
                  onClick={handleNewsletterSubscribe}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 ${colors.primary} rounded-lg font-semibold transition-all`}
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'} pt-8`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className={`p-3 ${colors.primary} rounded-full`}>
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
              </div>
              <h5 className={`font-semibold ${colors.accent}`}>Free Shipping</h5>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>On orders over KSh 5,000</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className={`p-3 ${colors.primary} rounded-full`}>
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
              <h5 className={`font-semibold ${colors.accent}`}>Premium Quality</h5>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Curated products only</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className={`p-3 ${colors.primary} rounded-full`}>
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              <h5 className={`font-semibold ${colors.accent}`}>Loyalty Rewards</h5>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Earn points on every purchase</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className={`p-3 ${colors.primary} rounded-full`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h5 className={`font-semibold ${colors.accent}`}>Expert Support</h5>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Beauty consultants ready</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'} pt-8 mt-8`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                © {currentYear} Glow Beyond Beauty. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/info" className={`${isDark ? 'text-gray-400 hover:text-pink-400' : 'text-gray-500 hover:text-pink-600'} transition-colors text-sm`}>
                Privacy Policy
              </Link>
              <Link to="/info" className={`${isDark ? 'text-gray-400 hover:text-pink-400' : 'text-gray-500 hover:text-pink-600'} transition-colors text-sm`}>
                Terms of Service
              </Link>
              <Link to="/shop" className={`${isDark ? 'text-gray-400 hover:text-pink-400' : 'text-gray-500 hover:text-pink-600'} transition-colors text-sm`}>
                Shop All Products
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Made with</span>
              <Heart className={`w-4 h-4 ${colors.accent} fill-current`} />
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>for beauty lovers</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
