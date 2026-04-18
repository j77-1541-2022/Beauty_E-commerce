import React, { createContext, useContext, useState, useEffect } from 'react'
import { customerAPI } from '../services/customerAPI'
import { useAuth } from './AuthContext'

const CustomerAuthContext = createContext()

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  }
  return context
}

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { user: authUser, isAuthenticated: authIsAuthenticated } = useAuth()

  // Sync with AuthContext changes

  useEffect(() => {
    try {
      if (authIsAuthenticated && authUser) {
        // AuthContext has user - sync it to CustomerAuthContext
        setUser(authUser)
        setIsAuthenticated(true)
        setLoading(false)
      } else if (!authIsAuthenticated) {
        // User logged out - clear CustomerAuthContext
        setUser(null)
        setIsAuthenticated(false)
        setLoading(false)
      }
    } catch (error) {
      console.error('CustomerAuthContext sync error:', error)
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }, [authUser, authIsAuthenticated])


  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token && !authIsAuthenticated) {
        // Have token but not authenticated via AuthContext - fetch data
        fetchUserData()
      } else if (!token) {
        setLoading(false)
      }
    } catch (error) {
      console.error('CustomerAuthContext token check error:', error)
      setLoading(false)
    }
  }, [authIsAuthenticated])

  const fetchUserData = async () => {
    try {
      const userData = await customerAPI.getProfile()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      // If AuthContext already handled login, just sync the data
      const token = localStorage.getItem('accessToken')
      if (token && authUser) {
        setUser(authUser)
        setIsAuthenticated(true)
        setLoading(false)
        return { success: true }
      }

      // Normal login flow - call API
      const authData = await customerAPI.login(credentials)
      
      // Store tokens
      localStorage.setItem('accessToken', authData.access)
      localStorage.setItem('refreshToken', authData.refresh)
      
      // Fetch user data
      await fetchUserData()
      
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const signup = async (userData) => {
    try {
      const response = await customerAPI.signup(userData)
      
      // Auto-login after signup
      const loginResult = await login({
        username: userData.username,
        password: userData.password
      })
      
      return loginResult
    } catch (error) {
      console.error('Signup failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Signup failed' 
      }
    }
  }

  const logout = async () => {
    try {
      await customerAPI.logout?.()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await customerAPI.updateProfile(profileData)
      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      console.error('Profile update failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Update failed' 
      }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile,
    refreshUserData: fetchUserData
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}
