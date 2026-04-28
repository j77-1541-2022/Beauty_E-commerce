import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const notificationCounterRef = useRef(0)

  const showNotification = useCallback((message, type = 'info') => {
    notificationCounterRef.current += 1
    const id = `${Date.now()}-${notificationCounterRef.current}`
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in ${
                n.type === 'error' ? 'bg-red-500' :
                n.type === 'success' ? 'bg-emerald-500' :
                n.type === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              }`}
            >
              {n.message}
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export default NotificationContext
