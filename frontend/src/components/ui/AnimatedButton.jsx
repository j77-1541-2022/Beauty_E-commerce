import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useTheme } from '../../contexts/ThemeContext'

const AnimatedButton = ({
  children,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon,
  glow = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const { colors } = useTheme()
  
  const variants = {
    primary: colors.button,
    secondary: 'bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20',
    outline: `border-2 ${colors.accent} ${colors.accent} hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 hover:text-white`,
    ghost: `${colors.accent} hover:bg-opacity-10`,
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  }

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        glow && 'shadow-lg hover:shadow-xl',
        className
      )}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-5 h-5 animate-spin" />
        </motion.div>
      )}
      
      <motion.div
        className="flex items-center space-x-2"
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {icon && (
          <motion.div
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: 2, repeat: loading ? Infinity : 0, ease: "linear" }}
          >
            {icon}
          </motion.div>
        )}
        
        {!loading && (
          <>
            {children}
            {glow && <Sparkles className="w-4 h-4" />}
          </>
        )}
      </motion.div>
      
      {glow && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${colors.primary} opacity-0 -z-10`}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ filter: 'blur(20px)' }}
        />
      )}
    </motion.button>
  )
}

export default AnimatedButton
