import React, { createContext, useContext, useState } from 'react'

const CompareContext = createContext()

export const useCompare = () => {
  const context = useContext(CompareContext)
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider')
  }
  return context
}

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState([])

  const MAX_COMPARE_ITEMS = 4

  const addToCompare = (product) => {
    setCompareList(prev => {
      // Check if product already in compare list
      if (prev.some(p => p.id === product.id)) {
        return prev
      }
      // Check if max items reached
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return prev
      }
      return [...prev, product]
    })
  }

  const removeFromCompare = (productId) => {
    setCompareList(prev => prev.filter(p => p.id !== productId))
  }

  const clearCompare = () => {
    setCompareList([])
  }

  const isInCompare = (productId) => {
    return compareList.some(p => p.id === productId)
  }

  const getCompareCount = () => {
    return compareList.length
  }

  const value = {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    getCompareCount,
    MAX_COMPARE_ITEMS
  }

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  )
}

export default CompareContext
