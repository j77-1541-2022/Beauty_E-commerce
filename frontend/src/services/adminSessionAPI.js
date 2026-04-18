import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Create axios instance for admin session (no auth required)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Django admin session cookies
})

// Admin Session API
export const adminSessionAPI = {
  // Check if user is authenticated in Django admin
  checkSession: async () => {
    try {
      const response = await api.get('/users/admin-session/check/')
      return response.data
    } catch (error) {
      console.error('Failed to check admin session:', error)
      return { success: false, user: null }
    }
  },

  // Login to frontend using Django admin session
  loginWithSession: async () => {
    try {
      const response = await api.post('/users/admin-session/login/')
      return response.data
    } catch (error) {
      console.error('Failed to login with admin session:', error)
      return { success: false, error: 'Failed to login with admin session' }
    }
  },

  // Auto-detect and login admin session
  autoLogin: async () => {
    try {
      // First check if admin session exists
      const sessionCheck = await adminSessionAPI.checkSession()
      
      if (sessionCheck.success && sessionCheck.user) {
        // If admin session exists, get JWT tokens
        const loginResult = await adminSessionAPI.loginWithSession()
        
        if (loginResult.success) {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', loginResult.access)
          localStorage.setItem('refreshToken', loginResult.refresh)
          
          return {
            success: true,
            user: loginResult.user,
            message: 'Admin session detected and logged in automatically'
          }
        }
      }
      
      return { success: false, message: 'No admin session found' }
    } catch (error) {
      console.error('Auto login failed:', error)
      return { success: false, error: 'Auto login failed' }
    }
  }
}

export default adminSessionAPI
