import { useState, useEffect, useCallback } from 'react'
import { cartAPI } from '../services/cartAPI'

const useCart = () => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await cartAPI.getCart()
      setCart(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Add item to cart
  const addToCart = useCallback(async (productId, quantity = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await cartAPI.addToCart(productId, quantity)
      setCart(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add to cart'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Update cart item
  const updateCartItem = useCallback(async (itemId, quantity) => {
    setLoading(true)
    setError(null)
    try {
      const response = await cartAPI.updateCartItem(itemId, quantity)
      setCart(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update cart'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await cartAPI.removeFromCart(itemId)
      setCart(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to remove from cart'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear cart
  const clearCart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await cartAPI.clearCart()
      setCart(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to clear cart'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Get cart total
  const getCartTotal = useCallback(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [cart])

  // Get cart item count
  const getCartItemCount = useCallback(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((count, item) => count + item.quantity, 0)
  }, [cart])

  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    if (!cart?.items) return false
    return cart.items.some(item => item.product.id === productId)
  }, [cart])

  // Get item quantity
  const getItemQuantity = useCallback((productId) => {
    if (!cart?.items) return 0
    const item = cart.items.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }, [cart])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isInCart,
    getItemQuantity
  }
}

export default useCart
