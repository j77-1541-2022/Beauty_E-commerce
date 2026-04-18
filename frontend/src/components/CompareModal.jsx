import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Scale, Check, X as XIcon } from 'lucide-react'
import { useCompare } from '../contexts/CompareContext'
import { getProductPlaceholder, resolveProductImage } from '../utils/productImage'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'

const CompareModal = ({ isOpen, onClose }) => {
  const { compareList, removeFromCompare, clearCompare } = useCompare()
  const { colors, theme } = useTheme()
  const { formatPrice } = useCurrency()
  const isDark = theme === 'dark'

  const compareAttributes = [
    { key: 'price', label: 'Price', render: (val) => formatPrice(val) },
    { key: 'category', label: 'Category', render: (val) => val || 'N/A' },
    { key: 'rating', label: 'Rating', render: (val) => val ? `${val.toFixed(1)} ⭐` : 'N/A' },
    { key: 'stock_quantity', label: 'Stock', render: (val) => val > 0 ? `${val} available` : 'Out of stock' },
    { key: 'dealer_info', label: 'Seller', render: (val) => val?.business_name || 'Glow Beyond Store' },
    { key: 'description', label: 'Description', render: (val) => val?.substring(0, 100) + '...' || 'N/A' }
  ]

  const getStockStatusColor = (quantity) => {
    if (quantity === 0) return 'text-red-500'
    if (quantity <= 5) return 'text-amber-500'
    return 'text-green-500'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-6xl max-h-[90vh] ${colors.card} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${colors.cardBorder}`}>
            <div className="flex items-center gap-3">
              <Scale className={`w-6 h-6 ${colors.accent}`} />
              <h2 className={`text-2xl font-bold ${colors.text}`}>Compare Products</h2>
              <span className={`px-3 py-1 rounded-full ${colors.primary} text-white text-sm`}>
                {compareList.length} items
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearCompare}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-red-900/20 hover:bg-red-900/30' : 'bg-red-50 hover:bg-red-100'} text-red-600 transition-colors`}
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${colors.textMuted} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {compareList.length === 0 ? (
              <div className="text-center py-12">
                <Scale className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4 opacity-50`} />
                <p className={colors.textMuted}>No products to compare</p>
                <p className={`text-sm ${colors.textMuted} mt-2`}>Add products from the shop to compare them</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Product Columns */}
                {compareList.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${colors.card} border ${colors.cardBorder} rounded-xl overflow-hidden`}
                  >
                    {/* Product Image */}
                    <div className="relative">
                      <img
                        src={resolveProductImage(product)}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = getProductPlaceholder(product)
                        }}
                      />
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
                      >
                        <XIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    {/* Product Name */}
                    <div className="p-4">
                      <h3 className={`font-semibold ${colors.text} mb-2 line-clamp-2`}>
                        {product.name}
                      </h3>
                      <p className={`text-lg font-bold ${colors.accent}`}>
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Attributes */}
                    <div className="border-t border-gray-200">
                      {compareAttributes.map((attr) => (
                        <div
                          key={attr.key}
                          className={`p-3 border-b ${colors.cardBorder} last:border-b-0`}
                        >
                          <p className={`text-xs ${colors.textMuted} mb-1`}>{attr.label}</p>
                          <p className={`text-sm ${colors.text}`}>
                            {attr.render(product[attr.key])}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Add to Cart Button */}
                    <div className="p-4">
                      <button
                        className={`w-full py-2 rounded-lg ${colors.primary} text-white font-semibold hover:opacity-90 transition-opacity`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {compareList.length > 0 && (
            <div className={`p-4 border-t ${colors.cardBorder}`}>
              <p className={`text-sm ${colors.textMuted} text-center`}>
                Showing comparison for {compareList.length} products. Maximum {compareList.length}/{4} products allowed.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CompareModal
