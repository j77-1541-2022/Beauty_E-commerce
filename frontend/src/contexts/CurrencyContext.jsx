import React, { createContext, useContext, useState, useEffect } from 'react'

const CurrencyContext = createContext()

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('KSH')
  const [exchangeRate, setExchangeRate] = useState(1) // Default KSH rate
  
  const currencies = {
    KSH: { symbol: 'KSh', code: 'KSH', rate: 1 },
    USD: { symbol: '$', code: 'USD', rate: 0.0078 }, // 1 KSH ≈ 0.0078 USD
    EUR: { symbol: '€', code: 'EUR', rate: 0.0072 }, // 1 KSH ≈ 0.0072 EUR
    GBP: { symbol: '£', code: 'GBP', rate: 0.0062 }  // 1 KSH ≈ 0.0062 GBP
  }

  useEffect(() => {
    // Load saved currency from localStorage
    const savedCurrency = localStorage.getItem('currency')
    if (savedCurrency && currencies[savedCurrency]) {
      setCurrency(savedCurrency)
      setExchangeRate(currencies[savedCurrency].rate)
    }
  }, [])

  const changeCurrency = (newCurrency) => {
    if (currencies[newCurrency]) {
      setCurrency(newCurrency)
      setExchangeRate(currencies[newCurrency].rate)
      localStorage.setItem('currency', newCurrency)
    }
  }

  const formatPrice = (priceInKSH, displayCurrency = currency) => {
    const rate = currencies[displayCurrency]?.rate || 1
    const symbol = currencies[displayCurrency]?.symbol || 'KSh'
    const convertedPrice = priceInKSH * rate
    
    // Format based on currency
    switch (displayCurrency) {
      case 'KSH':
        return `${symbol} ${convertedPrice.toFixed(0)}`
      case 'USD':
      case 'EUR':
      case 'GBP':
        return `${symbol}${convertedPrice.toFixed(2)}`
      default:
        return `${symbol} ${convertedPrice.toFixed(2)}`
    }
  }

  const convertPrice = (priceInKSH, targetCurrency = currency) => {
    const rate = currencies[targetCurrency]?.rate || 1
    return priceInKSH * rate
  }

  const value = {
    currency,
    currencies,
    exchangeRate,
    changeCurrency,
    formatPrice,
    convertPrice,
    currentCurrencyInfo: currencies[currency]
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export default CurrencyContext
