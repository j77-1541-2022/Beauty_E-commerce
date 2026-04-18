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

// Customer Authentication API
export const customerAPI = {
  // Customer signup
  signup: async (userData) => {
    try {
      const response = await api.post('/users/signup/', userData)
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

  // Customer login (uses existing JWT endpoint)
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/token/', credentials)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get customer dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/users/dashboard/')
      return response.data
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },

  // Get customer profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile/')
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

  // Update customer profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile/update/', profileData)
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

  // Get customer orders
  getOrders: async () => {
    try {
      const response = await api.get('/orders/')
      return response.data
    } catch (error) {
      console.error('Orders fetch error:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },

  // Get order details by ID
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/`)
      return response.data
    } catch (error) {
      console.error('Order details fetch error:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
}

export default customerAPI
