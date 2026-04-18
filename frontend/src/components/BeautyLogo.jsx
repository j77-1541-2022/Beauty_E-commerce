import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Gem, Crown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const BeautyLogo = ({ size = 'large', animated = true, showTagline = false }) => {
  const { colors } = useTheme()
  
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl',
    xlarge: 'text-5xl'
  }

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
    xlarge: 'w-12 h-12'
  }

  const LogoIcon = () => (
    <motion.div
      className={`relative ${iconSizes[size]}`}
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className={`absolute inset-0 ${colors.primary} rounded-full`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="relative bg-white rounded-full p-2 flex items-center justify-center">
        <Gem className={`${colors.accent} ${size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : size === 'large' ? 'w-5 h-5' : 'w-6 h-6'}`} />
      </div>
      <motion.div
        className="absolute -top-1 -right-1"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
      </motion.div>
    </motion.div>
  )

  const LogoText = () => (
    <div className="flex flex-col">
      <motion.h1
        className={`font-bold ${sizeClasses[size]} ${colors.primary} bg-clip-text text-transparent`}
        animate={animated ? {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={animated ? {
          backgroundSize: '200% 200%'
        } : {}}
      >
        Glow Beyond
      </motion.h1>
      <motion.span
        className={`font-semibold ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : size === 'large' ? 'text-lg' : 'text-xl'} ${colors.primary} bg-clip-text text-transparent`}
        animate={animated ? {
          opacity: [0.7, 1, 0.7]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Beauty
      </motion.span>
    </div>
  )

  return (
    <motion.div
      className="flex items-center space-x-3"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <LogoIcon />
      <LogoText />
      {showTagline && (
        <motion.div
          className={`hidden md:block ml-4 pl-4 border-l ${colors.cardBorder}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className={`text-sm ${colors.accent} font-medium italic`}>
            "Where Beauty Meets Elegance"
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default BeautyLogo
