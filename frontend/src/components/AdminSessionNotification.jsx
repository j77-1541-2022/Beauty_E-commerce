import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const AdminSessionNotification = () => {
  const { adminSessionDetected, user } = useAuth()
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (adminSessionDetected && user) {
      setShowNotification(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [adminSessionDetected, user])

  if (!showNotification) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-xl p-4 border border-green-400">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-100">Admin Session Detected</h4>
              <p className="text-green-50 text-sm mt-1">
                You've been automatically logged in as {user?.username}
              </p>
              <div className="flex items-center space-x-2 mt-2 text-green-100 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>Accessing admin dashboard</span>
              </div>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="flex-shrink-0 p-1 hover:bg-green-400 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AdminSessionNotification
