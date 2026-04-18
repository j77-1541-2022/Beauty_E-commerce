import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader } from 'lucide-react'

const PageTransitionLoader = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.div
              className="flex items-center space-x-2 text-white"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-lg font-medium">Loading...</span>
            </motion.div>
            
            <motion.div
              className="mt-4 flex space-x-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PageTransitionLoader
