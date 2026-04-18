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

// Wishlist API
export const wishlistAPI = {
  // Get wishlist
  getWishlist: async () => {
    try {
      const response = await api.get('/wishlist/')
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

  // Add item to wishlist
  addToWishlist: async (productId) => {
    try {
      const response = await api.post('/wishlist/add_item/', {
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

  // Remove item from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const response = await api.post('/wishlist/remove_item/', {
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

  // Check if item is in wishlist
  isInWishlist: async (productId) => {
    try {
      const response = await api.get(`/wishlist/check_item/${productId}/`)
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

  // Clear wishlist
  clearWishlist: async () => {
    try {
      const response = await api.post('/wishlist/clear/')
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

export default wishlistAPI
