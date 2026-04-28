import React, { createContext, useState, useEffect, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('beauty-theme')
    return savedTheme || 'light'
  })

  const themes = {
    'light': {
      name: 'Light',
      background: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
      primary: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
      primaryHover: 'hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600',
      secondary: 'bg-white',
      accent: 'text-pink-600',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      card: 'bg-white/95 backdrop-blur-sm',
      cardBorder: 'border-gray-200',
      shadow: 'shadow-lg shadow-gray-900/10',
      input: 'bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500',
      button: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
      nav: 'bg-white/95 backdrop-blur-md border-b border-gray-200',
      link: 'text-pink-600 hover:text-pink-800',
      success: 'text-green-700 bg-green-50',
      error: 'text-red-700 bg-red-50',
      warning: 'text-amber-700 bg-amber-50'
    },
    'dark': {
      name: 'Dark',
      background: 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950',
      primary: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
      primaryHover: 'hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600',
      secondary: 'bg-gray-800',
      accent: 'text-pink-400',
      text: 'text-gray-100',
      textMuted: 'text-gray-400',
      card: 'bg-gray-800/95 backdrop-blur-sm',
      cardBorder: 'border-gray-700',
      shadow: 'shadow-lg shadow-black/30',
      input: 'bg-gray-700 border-gray-600 text-white focus:border-pink-500 focus:ring-pink-500',
      button: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold',
      nav: 'bg-gray-900/95 backdrop-blur-md border-b border-gray-800',
      link: 'text-pink-400 hover:text-pink-300',
      success: 'text-green-400 bg-green-900/30',
      error: 'text-red-400 bg-red-900/30',
      warning: 'text-amber-400 bg-amber-900/30'
    },
    'blue': {
      name: 'Blue',
      background: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50',
      primary: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500',
      primaryHover: 'hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-600',
      secondary: 'bg-white',
      accent: 'text-blue-600',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      card: 'bg-white/95 backdrop-blur-sm',
      cardBorder: 'border-blue-200',
      shadow: 'shadow-lg shadow-blue-900/10',
      input: 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      button: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      nav: 'bg-white/95 backdrop-blur-md border-b border-blue-100',
      link: 'text-blue-600 hover:text-blue-800',
      success: 'text-green-700 bg-green-50',
      error: 'text-red-700 bg-red-50',
      warning: 'text-amber-700 bg-amber-50'
    },
    'rose-gold': {
      name: 'Rose Gold',
      background: 'bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50',
      primary: 'bg-gradient-to-r from-rose-400 via-pink-500 to-amber-400',
      primaryHover: 'hover:from-rose-500 hover:via-pink-600 hover:to-amber-500',
      secondary: 'bg-white',
      accent: 'text-rose-600',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      card: 'bg-white/95 backdrop-blur-sm',
      cardBorder: 'border-rose-200',
      shadow: 'shadow-lg shadow-rose-900/10',
      input: 'bg-white border-gray-300 focus:border-rose-500 focus:ring-rose-500',
      button: 'bg-gradient-to-r from-rose-400 to-pink-500 text-white',
      nav: 'bg-white/95 backdrop-blur-md border-b border-rose-100',
      link: 'text-rose-600 hover:text-rose-800',
      success: 'text-green-700 bg-green-50',
      error: 'text-red-700 bg-red-50',
      warning: 'text-amber-700 bg-amber-50'
    }
  }

  useEffect(() => {
    localStorage.setItem('beauty-theme', theme)
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // Apply dark/light class to root for Tailwind darkMode: 'class' support
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme)
    }
  }

  const toggleDarkMode = () => {
    const isDark = theme === 'dark'
    changeTheme(isDark ? 'light' : 'dark')
  }

  const isDark = theme === 'dark'

  const value = {
    theme,
    themes,
    colors: themes[theme],
    changeTheme,
    toggleDarkMode,
    isDark,
    currentTheme: themes[theme]
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
