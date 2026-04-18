import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Sparkles } from 'lucide-react'

const AddToCartAnimation = ({ trigger, productId, productName, productImage }) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [cartItems, setCartItems] = useState(0)

  useEffect(() => {
    if (trigger) {
      handleAddToCart()
    }
  }, [trigger])

  const handleAddToCart = () => {
    setIsAnimating(true)
    
    // Simulate cart addition
    setTimeout(() => {
      setCartItems(prev => prev + 1)
      setShowSuccess(true)
      setIsAnimating(false)
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
    }, 1500)
  }

  return (
    <>
      {/* Flying Product Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ 
              scale: 1,
              opacity: 1,
              zIndex: 50
            }}
            animate={{
              scale: [1, 0.8, 0.6, 0.4],
              opacity: [1, 1, 0.8, 0],
              y: [0, -50, -100, -150],
              x: [0, 50, 100, 150],
              rotate: [0, 10, -10, 0],
              zIndex: [50, 60, 70, 80]
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              times: [0, 0.3, 0.6, 1]
            }}
            className="fixed pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: 2
                }}
                className="absolute -inset-4 bg-purple-500/30 rounded-full blur-xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Icon Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.2, 1.1, 1],
              rotate: [0, -10, 5, 0]
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              times: [0, 0.3, 0.7, 1]
            }}
            className="fixed top-4 right-4 pointer-events-none"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs font-bold">{cartItems + 1}</span>
                </motion.div>
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: 2
                }}
                className="absolute -inset-3 bg-purple-500/30 rounded-full blur-xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: "linear" }}
              >
                <Check className="w-5 h-5" />
              </motion.div>
              <span className="font-medium">
                {productName || 'Product'} added to cart!
              </span>
              <Sparkles className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle Effects */}
      <AnimatePresence>
        {isAnimating && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scale: 0,
                  opacity: 0,
                  x: '50%',
                  y: '50%'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: ['50%', `${50 + (Math.random() - 0.5) * 200}%`],
                  y: ['50%', `${50 + (Math.random() - 0.5) * 200}%`]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AddToCartAnimation
