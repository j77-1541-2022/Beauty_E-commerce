import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartAPI } from '../services/cartAPI'
import { useCustomerAuth } from './CustomerAuthContext'
import { useNotification } from './NotificationContext'
import { useErrorHandler } from './ErrorHandlerContext'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useCustomerAuth()
  const { showNotification } = useNotification()
  const { handleError, setLoading: setGlobalLoading } = useErrorHandler()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartCount, setCartCount] = useState(0)

  // Fetch cart from server dynamically
  const fetchCartFromServer = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('🔒 Not authenticated, skipping cart fetch')
      return
    }
    
    try {
      setLoading(true)
      setGlobalLoading('cart.fetch', true)
      console.log('🛒 Fetching cart from server...')
      const response = await cartAPI.getCart()
      console.log('📦 Cart response:', response)
      
      if (response && response.items) {
        // Transform server cart items to local format
        const transformedItems = response.items.map(item => ({
          id: item.product?.id,
          name: item.product?.name,
          price: item.product?.selling_price || item.product?.price || 0,
          image: item.product?.primary_image,
          quantity: item.quantity,
          discount: item.product?.discount || 0
        }))
        console.log('✅ Transformed items:', transformedItems)
        setCartItems(transformedItems)
        
        // Calculate totals from transformed items (fallback if server values missing)
        const calculatedCount = transformedItems.reduce((sum, item) => sum + item.quantity, 0)
        const calculatedTotal = transformedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        console.log('💰 Server totals:', { total_items: response.total_items, total_price: response.total_price })
        console.log('💰 Calculated totals:', { calculatedCount, calculatedTotal })
        
        setCartCount(response.total_items ?? calculatedCount)
        setCartTotal(response.total_price ?? calculatedTotal)
      } else {
        console.log('🛒 No items in cart response, resetting cart')
        // No items - reset cart
        setCartItems([])
        setCartCount(0)
        setCartTotal(0)
      }
    } catch (error) {
      console.error('❌ Failed to fetch cart from server:', error)
      handleError(error, 'Cart Sync')
    } finally {
      setLoading(false)
      setGlobalLoading('cart.fetch', false)
    }
  }, [isAuthenticated, handleError, setGlobalLoading])

  // Load cart on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartFromServer()
    } else {
      loadCartFromStorage()
    }
  }, [isAuthenticated, fetchCartFromServer])

  // Sync with server when cart changes (for authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      if (cartItems.length > 0) {
        localStorage.setItem('cart', JSON.stringify(cartItems))
        calculateTotals()
      } else {
        localStorage.removeItem('cart')
        setCartTotal(0)
        setCartCount(0)
      }
    }
  }, [cartItems, isAuthenticated])

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cartData = JSON.parse(savedCart)
        setCartItems(cartData)
        calculateTotals()
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    }
  }

  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => {
      const itemTotal = (item.discount > 0
        ? item.price * (1 - item.discount / 100)
        : item.price) * item.quantity
      return sum + itemTotal
    }, 0)

    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    setCartTotal(total)
    setCartCount(count)
  }

  // Helper to update cart state from server response
  const updateCartFromServerData = (data) => {
    console.log('🔄 Updating cart from server data:', data)
    if (data && data.items) {
      const transformedItems = data.items.map(item => ({
        id: item.product?.id,
        name: item.product?.name,
        price: item.product?.selling_price || item.product?.price || 0,
        image: item.product?.primary_image,
        quantity: item.quantity,
        discount: item.product?.discount || 0
      }))
      setCartItems(transformedItems)
      
      const calculatedCount = transformedItems.reduce((sum, item) => sum + item.quantity, 0)
      const calculatedTotal = transformedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      setCartCount(data.total_items ?? calculatedCount)
      setCartTotal(data.total_price ?? calculatedTotal)
      console.log('✅ Cart updated:', { count: data.total_items ?? calculatedCount, total: data.total_price ?? calculatedTotal })
    } else {
      setCartItems([])
      setCartCount(0)
      setCartTotal(0)
    }
  }

  // refreshCart alias for fetchCartFromServer
  const refreshCart = fetchCartFromServer

  const addToCart = async (product, quantity = 1) => {
    setLoading(true)
    setGlobalLoading('cart.add', true)

    try {
      // For authenticated users, use server API
      if (isAuthenticated) {
        console.log('🛒 addToCart - calling API...')
        const response = await cartAPI.addItem(product.id, quantity)
        console.log('✅ addToCart - API response:', response)
        updateCartFromServerData(response) // Use returned cart data directly
        showNotification('Added to cart', 'success')
        return true
      }
      
      // For guest users, use localStorage
      const existingItem = cartItems.find(item => item.id === product.id)

      if (existingItem) {
        const updatedCart = cartItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        setCartItems(updatedCart)
      } else {
        const cartItem = {
          ...product,
          quantity,
          addedAt: new Date().toISOString()
        }
        setCartItems(prev => [...prev, cartItem])
      }

      showNotification('Added to cart', 'success')

      return true
    } catch (error) {
      console.error('Failed to add to cart:', error)
      handleError(error, 'Add to Cart')
      showNotification('Failed to add to cart', 'error')
      return false
    } finally {
      setLoading(false)
      setGlobalLoading('cart.add', false)
    }
  }

  const removeFromCart = async (productId) => {
    setLoading(true)
    setGlobalLoading('cart.remove', true)

    try {
      if (isAuthenticated) {
        console.log('🗑️ removeFromCart - calling API...')
        const response = await cartAPI.removeItem(productId)
        console.log('✅ removeFromCart - API response:', response)
        updateCartFromServerData(response) // Use returned cart data directly
        showNotification('Item removed from cart', 'info')
        return true
      }
      
      setCartItems(prev => prev.filter(item => item.id !== productId))
      showNotification('Item removed from cart', 'info')
      return true
    } catch (error) {
      console.error('Failed to remove from cart:', error)
      handleError(error, 'Remove from Cart')
      showNotification('Failed to remove item', 'error')
      return false
    } finally {
      setLoading(false)
      setGlobalLoading('cart.remove', false)
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId)
    }

    setLoading(true)
    setGlobalLoading('cart.update', true)

    try {
      if (isAuthenticated) {
        console.log('📊 updateQuantity - calling API...')
        const response = await cartAPI.updateQuantity(productId, quantity)
        console.log('✅ updateQuantity - API response:', response)
        updateCartFromServerData(response) // Use returned cart data directly
        showNotification('Cart updated', 'success')
        return true
      }
      
      setCartItems(prev =>
        prev.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      )
      showNotification('Cart updated', 'success')
      return true
    } catch (error) {
      console.error('Failed to update quantity:', error)
      handleError(error, 'Update Cart Quantity')
      showNotification('Failed to update cart', 'error')
      return false
    } finally {
      setLoading(false)
      setGlobalLoading('cart.update', false)
    }
  }

  const clearCart = () => {
    setLoading(true)
    setGlobalLoading('cart.clear', true)

    try {
      setCartItems([])
      setCartCount(0)
      setCartTotal(0)
      localStorage.removeItem('cart')
      showNotification('Cart cleared', 'info')
      return true
    } catch (error) {
      console.error('Failed to clear cart:', error)
      handleError(error, 'Clear Cart')
      showNotification('Failed to clear cart', 'error')
      return false
    } finally {
      setLoading(false)
      setGlobalLoading('cart.clear', false)
    }
  }

  const moveFromWishlistToCart = (product) => {
    return addToCart(product, 1)
  }

  const getCartItemsCount = () => {
    return cartCount
  }

  const getCartCount = () => {
    return cartCount
  }

  const getCartItems = () => {
    return cartItems
  }

  const getCartTotal = () => {
    return cartTotal
  }

  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId)
  }

  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  // Sync cart with server when user logs in
  const syncCartWithServer = async (userCart) => {
    try {
      setLoading(true)
      setCartItems(userCart)
      calculateTotals()
      return true
    } catch (error) {
      console.error('Failed to sync cart:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Merge local cart with server cart
  const mergeCarts = async (serverCart) => {
    try {
      setLoading(true)

      // Combine local and server carts
      const mergedCart = [...serverCart]

      cartItems.forEach(localItem => {
        const existingServerItem = mergedCart.find(item => item.id === localItem.id)
        if (existingServerItem) {
          existingServerItem.quantity += localItem.quantity
        } else {
          mergedCart.push(localItem)
        }
      })

      setCartItems(mergedCart)
      calculateTotals()
      return true
    } catch (error) {
      console.error('Failed to merge carts:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const value = {
    cartItems,
    loading,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    moveFromWishlistToCart,
    getCartItemsCount,
    getCartCount,
    getCartItems,
    getCartTotal,
    isInCart,
    getItemQuantity,
    syncCartWithServer,
    mergeCarts,
    calculateTotals,
    refreshCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default CartContext
