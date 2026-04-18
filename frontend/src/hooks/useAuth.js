import { useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/apiClient'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check authentication status
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.getUser()
      setUser(response.data)
    } catch (err) {
      // Token might be expired, clear it
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setError('Session expired. Please login again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Login function
  const login = useCallback(async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.login(credentials)
      const { access, refresh, user: userData } = response.data

      // Store tokens
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)

      // Set user data
      setUser(userData)

      return { success: true, user: userData }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true)
    try {
      // Call logout API if available
      await authAPI.logout?.()
    } catch (err) {
      // Continue with local logout even if API fails
      console.error('Logout API failed:', err)
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      
      // Clear user data
      setUser(null)
      setError(null)
      setLoading(false)
    }
  }, [])

  // Refresh token
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refreshToken')
    if (!refresh) {
      logout()
      return false
    }

    try {
      const response = await authAPI.refreshToken({ refresh })
      const { access } = response.data
      
      localStorage.setItem('accessToken', access)
      return true
    } catch (err) {
      logout()
      return false
    }
  }, [logout])

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(response.data)
      return { success: true, user: response.data }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Profile update failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role
  }, [user])

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role)
  }, [user])

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole('admin') || hasRole('staff')
  }, [hasRole])

  // Check if user is customer
  const isCustomer = useCallback(() => {
    return hasRole('customer')
  }, [hasRole])

  // Get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (!user) return ''
    const { first_name, last_name, username } = user
    if (first_name && last_name) {
      return `${first_name[0]}${last_name[0]}`.toUpperCase()
    }
    return username?.slice(0, 2).toUpperCase() || ''
  }, [user])

  // Get user display name
  const getDisplayName = useCallback(() => {
    if (!user) return ''
    const { first_name, last_name, username } = user
    if (first_name && last_name) {
      return `${first_name} ${last_name}`
    }
    return username || ''
  }, [user])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCustomer,
    getUserInitials,
    getDisplayName,
    checkAuth
  }
}

export default useAuth
