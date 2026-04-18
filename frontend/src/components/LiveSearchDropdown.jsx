import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getProductPlaceholder, resolveProductImage } from '../utils/productImage'

const LiveSearchDropdown = ({ placeholder = "Search products..." }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Mock search data - replace with actual API call
  const mockProducts = [
    { id: 1, name: 'Rose Gold Serum', category: 'Skincare', price: 89.99, rating: 4.8, image: '/images/product1.jpg' },
    { id: 2, name: 'Diamond Cream', category: 'Skincare', price: 129.99, rating: 4.9, image: '/images/product2.jpg' },
    { id: 3, name: 'Pearl Mask Set', category: 'Treatment', price: 59.99, rating: 4.7, image: '/images/product3.jpg' },
    { id: 4, name: 'Sapphire Eye Cream', category: 'Skincare', price: 79.99, rating: 4.6, image: '/images/product4.jpg' },
    { id: 5, name: 'Emerald Face Oil', category: 'Skincare', price: 99.99, rating: 4.8, image: '/images/product5.jpg' },
    { id: 6, name: 'Ruby Lip Gloss', category: 'Makeup', price: 39.99, rating: 4.5, image: '/images/product6.jpg' },
    { id: 7, name: 'Amber Body Butter', category: 'Body Care', price: 49.99, rating: 4.7, image: '/images/product7.jpg' },
    { id: 8, name: 'Crystal Toner', category: 'Skincare', price: 69.99, rating: 4.9, image: '/images/product8.jpg' }
  ]

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchProducts = async () => {
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const filtered = mockProducts.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
        )
        
        setResults(filtered)
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const highlightMatch = (text, query) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-purple-500/30 text-purple-100 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleKeyDown = (e) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigate(`/product/${results[selectedIndex].id}`)
          setIsOpen(false)
          setQuery('')
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleResultClick = (product) => {
    navigate(`/product/${product.id}`)
    setIsOpen(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 transition-colors ${
            isOpen ? 'text-purple-400' : 'text-gray-400'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
        />
        
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-purple-400 hover:text-white transition-colors cursor-pointer" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-purple-600">Searching...</span>
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-purple-100">
                  <p className="text-sm text-purple-600 font-medium">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                {results.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.05 }}
                    className={`px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-purple-50' : ''
                    }`}
                    onClick={() => handleResultClick(product)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={resolveProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = getProductPlaceholder(product)
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {highlightMatch(product.name, query)}
                          </h4>
                          <span className="text-sm font-semibold text-purple-600">
                            ${product.price}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {highlightMatch(product.category, query)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
                <div className="px-4 py-3 border-t border-purple-100">
                  <button
                    onClick={() => {
                      navigate(`/shop?q=${encodeURIComponent(query)}`)
                      setIsOpen(false)
                    }}
                    className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    View all results for "{query}"
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No products found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try searching for "{query}" with different keywords
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LiveSearchDropdown
