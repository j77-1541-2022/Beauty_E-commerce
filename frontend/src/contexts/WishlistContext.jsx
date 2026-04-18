import React, { createContext, useContext, useState, useEffect } from 'react'

const WishlistContext = createContext()

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const savedWishlist = localStorage.getItem('wishlist')
        if (savedWishlist) {
          setWishlistItems(JSON.parse(savedWishlist))
        }
      } catch (error) {
        console.error('Failed to load wishlist:', error)
      }
    }

    loadWishlist()
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlistItems.length > 0) {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems))
    } else {
      localStorage.removeItem('wishlist')
    }
  }, [wishlistItems])

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId)
  }

  // Add product to wishlist
  const addToWishlist = (product) => {
    setLoading(true)
    
    try {
      // Check if already in wishlist
      if (isInWishlist(product.id)) {
        return false
      }

      // Add to wishlist with timestamp
      const wishlistItem = {
        ...product,
        addedAt: new Date().toISOString(),
        id: product.id
      }

      setWishlistItems(prev => [...prev, wishlistItem])
      return true
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Remove product from wishlist
  const removeFromWishlist = (productId) => {
    setLoading(true)
    
    try {
      setWishlistItems(prev => prev.filter(item => item.id !== productId))
      return true
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Toggle wishlist status
  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      return removeFromWishlist(product.id)
    } else {
      return addToWishlist(product)
    }
  }

  // Clear entire wishlist
  const clearWishlist = () => {
    setLoading(true)
    
    try {
      setWishlistItems([])
      return true
    } catch (error) {
      console.error('Failed to clear wishlist:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlistItems.length
  }

  // Get wishlist items count by stock status
  const getAvailableItemsCount = () => {
    return wishlistItems.filter(item => 
      item.stock_status === 'in_stock' && item.stock_quantity > 0
    ).length
  }

  // Move wishlist item to cart
  const moveToCart = (productId) => {
    const item = wishlistItems.find(item => item.id === productId)
    if (item) {
      // Remove from wishlist
      removeFromWishlist(productId)
      // Return item for cart addition
      return item
    }
    return null
  }

  // Sync wishlist with user account (when logged in)
  const syncWishlistWithServer = async (userWishlist) => {
    try {
      setLoading(true)
      setWishlistItems(userWishlist)
      return true
    } catch (error) {
      console.error('Failed to sync wishlist:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const value = {
    wishlistItems,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistCount,
    getAvailableItemsCount,
    moveToCart,
    syncWishlistWithServer
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export default WishlistContext
