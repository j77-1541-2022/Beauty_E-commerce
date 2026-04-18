import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Cart API
export const cartAPI = {
  // Get cart
  getCart: async () => {
    try {
      const response = await api.get('/cart/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },

  // Add item to cart
  addItem: async (productId, quantity = 1) => {
    try {
      console.log('🛒 Adding to cart:', { productId, quantity })
      const response = await api.post('/cart/add_item/', {
        product_id: productId,
        quantity: quantity
      })
      console.log('✅ Cart add response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Cart add error:', error.response?.data || error.message)
      if (error.response?.status === 500) {
        throw new Error(error.response.data?.detail || 'Server error while adding to cart. Please try again.')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        throw new Error('Session expired. Please login again.')
      }
      if (error.response?.status === 404) {
        throw new Error('Product not found or is no longer available.')
      }
      throw error
    }
  },

  // Remove item from cart
  removeItem: async (productId) => {
    try {
      const response = await api.post('/cart/remove_item/', {
        product_id: productId
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },

  // Update item quantity
  updateQuantity: async (productId, quantity) => {
    try {
      const response = await api.post('/cart/update_quantity/', {
        product_id: productId,
        quantity: quantity
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await api.post('/cart/clear/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
}

export default cartAPI
