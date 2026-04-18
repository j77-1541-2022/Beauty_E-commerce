import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AnimatedBackground = ({ children, variant = 'default' }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const backgroundVariants = {
    default: {
      gradient: 'from-purple-300 via-pink-300 to-indigo-300',
      orbs: [
        { color: 'from-purple-400 to-pink-400', size: 'w-96 h-96', position: 'top-20 left-20' },
        { color: 'from-pink-400 to-rose-400', size: 'w-80 h-80', position: 'top-40 right-20' },
        { color: 'from-indigo-400 to-purple-400', size: 'w-72 h-72', position: 'bottom-20 left-1/2' },
        { color: 'from-rose-400 to-pink-400', size: 'w-64 h-64', position: 'bottom-40 right-1/3' }
      ]
    },
    sunset: {
      gradient: 'from-orange-300 via-pink-300 to-purple-300',
      orbs: [
        { color: 'from-orange-300 to-red-300', size: 'w-96 h-96', position: 'top-20 left-20' },
        { color: 'from-pink-300 to-purple-300', size: 'w-80 h-80', position: 'top-40 right-20' },
        { color: 'from-purple-300 to-indigo-300', size: 'w-72 h-72', position: 'bottom-20 left-1/2' },
        { color: 'from-red-300 to-orange-300', size: 'w-64 h-64', position: 'bottom-40 right-1/3' }
      ]
    },
    ocean: {
      gradient: 'from-blue-300 via-cyan-300 to-teal-300',
      orbs: [
        { color: 'from-blue-300 to-cyan-300', size: 'w-96 h-96', position: 'top-20 left-20' },
        { color: 'from-cyan-300 to-teal-300', size: 'w-80 h-80', position: 'top-40 right-20' },
        { color: 'from-teal-300 to-blue-300', size: 'w-72 h-72', position: 'bottom-20 left-1/2' },
        { color: 'from-blue-300 to-indigo-300', size: 'w-64 h-64', position: 'bottom-40 right-1/3' }
      ]
    },
    aurora: {
      gradient: 'from-green-300 via-blue-300 to-purple-300',
      orbs: [
        { color: 'from-green-300 to-emerald-300', size: 'w-96 h-96', position: 'top-20 left-20' },
        { color: 'from-blue-300 to-indigo-300', size: 'w-80 h-80', position: 'top-40 right-20' },
        { color: 'from-purple-300 to-pink-300', size: 'w-72 h-72', position: 'bottom-20 left-1/2' },
        { color: 'from-emerald-300 to-green-300', size: 'w-64 h-64', position: 'bottom-40 right-1/3' }
      ]
    },
    midnight: {
      gradient: 'from-slate-950 via-slate-900 to-indigo-950',
      orbs: [
        { color: 'from-slate-700 to-sky-900', size: 'w-96 h-96', position: 'top-20 left-20' },
        { color: 'from-indigo-900 to-purple-900', size: 'w-80 h-80', position: 'top-40 right-20' },
        { color: 'from-cyan-900 to-blue-900', size: 'w-72 h-72', position: 'bottom-20 left-1/2' },
        { color: 'from-violet-900 to-slate-800', size: 'w-64 h-64', position: 'bottom-40 right-1/3' }
      ]
    }
  }

  const currentVariant = backgroundVariants[variant]

  if (!mounted) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentVariant.gradient}`}>
        {children}
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${currentVariant.gradient}`}>
      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
            'linear-gradient(90deg, rgba(236, 72, 153, 0.3), rgba(59, 130, 246, 0.3))',
            'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
            'linear-gradient(180deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
            'linear-gradient(225deg, rgba(236, 72, 153, 0.3), rgba(34, 197, 94, 0.3))',
            'linear-gradient(270deg, rgba(34, 197, 94, 0.3), rgba(251, 146, 60, 0.3))',
            'linear-gradient(315deg, rgba(251, 146, 60, 0.3), rgba(147, 51, 234, 0.3))',
            'linear-gradient(360deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Floating Orbs */}
      <AnimatePresence>
        {currentVariant.orbs.map((orb, index) => (
          <motion.div
            key={index}
            className={`absolute ${orb.position} ${orb.size} bg-gradient-to-r ${orb.color} rounded-full mix-blend-multiply filter blur-xl`}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4 + index * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2
            }}
          />
        ))}
      </AnimatePresence>

      {/* Animated Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{
              y: [null, -100],
              x: [null, (Math.random() - 0.5) * 100],
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default AnimatedBackground
