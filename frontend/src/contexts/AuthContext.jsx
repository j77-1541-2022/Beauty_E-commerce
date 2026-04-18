import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/apiClient'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state from localStorage

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            const refreshedUser = await refreshUser()

            if (refreshedUser) {
              setUser(refreshedUser)
              setPermissions(refreshedUser.permissions || [])
              setIsAuthenticated(true)
            } else {
              await logout()
            }
          } catch (error) {
            console.error('Auth initialization error:', error)
            await logout()
          }
        }
      } catch (outerError) {
        console.error('Critical AuthContext error:', outerError)
        await logout()
      } finally {
        setLoading(false)
      }
    }
    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      console.log('Login attempt:', credentials.identifier)
      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data)
      const { access, refresh, user: userData } = response.data.data || response.data

      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('user', JSON.stringify(userData))

      setUser(userData)
      setPermissions(userData.permissions || [])
      setIsAuthenticated(true)

      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Response:', error.response)
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || error.response?.data?.error?.message || 'Login failed'
      }
    }
  }

  const logout = useCallback(async () => {
    try {
      // Proper logout cascade: call API first
      await authAPI.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
      setPermissions([])
      setIsAuthenticated(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile()
      const userData = response.data.data || response.data

      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setPermissions(userData.permissions || [])
      return userData
    } catch (error) {
      console.error('Failed to refresh user:', error)
      // If refresh fails due to auth, logout
      if (error.response?.status === 401) {
        await logout()
      }
      return null
    }
  }

  const hasPermission = useCallback((permission) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return permissions.includes(permission)
  }, [user, permissions])

  const canAccess = useCallback((resource, action = 'view') => {
    if (!user) return false
    if (user.role === 'admin') return true

    const permissionMap = {
      products: { view: 'view_product', edit: 'change_product', delete: 'delete_product' },
      orders: { view: 'view_order', edit: 'change_order', create: 'add_order' },
      inventory: { view: 'view_inventory', edit: 'change_inventory' },
      users: { view: 'view_user', edit: 'change_user' },
    }

    const permission = permissionMap[resource]?.[action]
    return permission ? hasPermission(permission) : false
  }, [user, hasPermission])

  const getDashboardRoute = useCallback(() => {
    if (!user) return '/login'

    switch (user.role) {
      case 'admin':
        return '/admin'
      case 'dealer':
        return '/dealer'
      case 'customer':
        return '/dashboard'
      default:
        return '/'
    }
  }, [user])

  const value = {
    user,
    isAuthenticated,
    loading,
    permissions,
    login,
    logout,
    refreshUser,
    hasPermission,
    canAccess,
    getDashboardRoute,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isDealer: user?.role === 'dealer',
    isCustomer: user?.role === 'customer',
    isVerified: user?.is_verified || false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
