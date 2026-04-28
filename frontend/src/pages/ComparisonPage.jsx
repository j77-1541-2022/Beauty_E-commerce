import React, { useState } from 'react'
import { useCompare } from '../contexts/CompareContext'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'
import { motion } from 'framer-motion'
import { 
  X, 
  ShoppingBag, 
  Star, 
  Check, 
  ChevronDown, 
  Download,
  Share2
} from 'lucide-react'
import { Link } from 'react-router-dom'

const ComparisonPage = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare()
  const { addItem } = useCart()
  const { showNotification } = useNotification()
  const [expandedFeatures, setExpandedFeatures] = useState({})

  const toggleFeature = (feature) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  const handleAddToCart = (product) => {
    addItem(product, 1)
    showNotification(`${product.name} added to cart`, 'success')
  }

  const handleDownloadComparison = () => {
    const comparison = compareList.map(p => ({
      Name: p.name,
      Price: `KSh ${p.price || p.selling_price}`,
      Rating: `${p.rating || 0}/5`,
      Category: p.category?.name || 'N/A',
      Brand: p.brand?.name || 'N/A',
      Description: p.description || 'N/A'
    }))

    const csv = [
      Object.keys(comparison[0]).join(','),
      ...comparison.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-comparison-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    showNotification('Comparison downloaded as CSV', 'success')
  }

  const handleShareComparison = () => {
    const productNames = compareList.map(p => p.name).join(', ')
    const text = `I'm comparing: ${productNames}\n\nCheck them out at Glow Beyond Beauty!`
    
    if (navigator.share) {
      navigator.share({
        title: 'Product Comparison',
        text: text,
      })
    } else {
      navigator.clipboard.writeText(text)
      showNotification('Comparison copied to clipboard', 'success')
    }
  }

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Products</h1>
            <p className="text-gray-600 mb-8">You haven't selected any products to compare yet</p>
            <Link 
              to="/shop"
              className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Start Comparing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Compare Products</h1>
          <p className="text-gray-600 mb-6">Comparing {compareList.length} of {compareList[0]?.MAX_COMPARE_ITEMS || 4} products</p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleDownloadComparison}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={handleShareComparison}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={clearCompare}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-48">Feature</th>
                {compareList.map((product, idx) => (
                  <th key={idx} className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-xs">
                    <div className="flex flex-col gap-3">
                      {product.primary_image && (
                        <img 
                          src={product.primary_image} 
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="text-red-500 hover:text-red-700 text-xs mt-2 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Price</td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                    <span className="text-lg font-bold text-pink-600">
                      KSh {(product.price || product.selling_price || 0).toLocaleString()}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Rating</td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating || 0}/5 ({product.review_count || 0} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Category</td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                    {product.category?.name || 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Brand</td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                    {product.brand?.name || 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Product Type */}
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Type</td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-900 capitalize">
                    {product.product_type || 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Description */}
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Description</td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-600">
                    <p className="line-clamp-3">{product.description || 'N/A'}</p>
                  </td>
                ))}
              </tr>

              {/* Add to Cart */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900"></td>
                {compareList.map((product, idx) => (
                  <td key={idx} className="px-6 py-4">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ComparisonPage
