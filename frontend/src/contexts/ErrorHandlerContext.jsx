import React, { createContext, useContext, useState, useCallback } from 'react'

const ErrorHandlerContext = createContext()

export const useErrorHandler = () => {
  const context = useContext(ErrorHandlerContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorHandlerProvider')
  }
  return context
}

export const ErrorHandlerProvider = ({ children }) => {
  const [error, setError] = useState(null)
  const [loadingStates, setLoadingStates] = useState({})

  const handleError = useCallback((error, context = 'Operation') => {
    console.error(`[${context}] Error:`, error)
    
    // Check for custom API response format: { success: false, message: "...", error: { code, message } }
    const responseData = error?.response?.data
    const errorMessage = responseData?.error?.message || 
                       responseData?.message || 
                       responseData?.detail || 
                       error?.message || 
                       'An unexpected error occurred'
    
    setError({
      message: errorMessage,
      context,
      status: error?.response?.status,
      code: responseData?.error?.code,
      timestamp: new Date().toISOString()
    })

    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isLoading = useCallback((key) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const hasAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading)
  }, [loadingStates])

  const value = {
    error,
    handleError,
    clearError,
    setLoading,
    isLoading,
    hasAnyLoading,
    loadingStates
  }

  return (
    <ErrorHandlerContext.Provider value={value}>
      {children}
    </ErrorHandlerContext.Provider>
  )
}

export default ErrorHandlerContext
