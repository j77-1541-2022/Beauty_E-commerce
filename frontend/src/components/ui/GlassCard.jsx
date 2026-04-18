import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export const GlassCard = ({
  children,
  className = '',
  hover = false,
  glow = false,
  variant = 'default',
  role = 'region',
  ariaLabel,
  tabIndex,
  onKeyDown,
  ...props
}) => {
  const variants = {
    default: 'bg-white/10 backdrop-blur-lg border border-white/20',
    dark: 'bg-black/10 backdrop-blur-lg border border-white/10',
    light: 'bg-white/80 backdrop-blur-sm border border-gray-200',
    colored: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/20'
  }

  const hoverVariants = hover ? {
    hover: {
      y: -4,
      scale: 1.02,
      boxShadow: glow ? '0 20px 40px rgba(147, 51, 234, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.1)'
    }
  } : {}

  return (
    <motion.div
      className={cn(
        'rounded-2xl transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
        'min-h-[44px] min-w-[44px]', // Mobile touch target size
        variants[variant],
        className
      )}
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      variants={hoverVariants}
      whileHover={hover ? 'hover' : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard
