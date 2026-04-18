import React, { useEffect, useState, useRef } from 'react'
import { motion, useAnimationFrame } from 'framer-motion'

const LuxuryBackground = ({ children, theme = 'cream-gold' }) => {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    
    // Canvas animation for floating particles
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resize()
    window.addEventListener('resize', resize)
    
    // Create particles based on theme
    const getParticleColor = () => {
      switch (theme) {
        case 'cream-gold':
          return `rgba(245, 158, 11, ${Math.random() * 0.3 + 0.1})` // amber
        case 'deep-luxury':
          return `rgba(251, 191, 36, ${Math.random() * 0.4 + 0.2})` // gold
        case 'rose-gold':
          return `rgba(244, 63, 94, ${Math.random() * 0.3 + 0.1})` // rose
        case 'emerald-luxury':
          return `rgba(16, 185, 129, ${Math.random() * 0.3 + 0.1})` // emerald
        default:
          return `rgba(245, 158, 11, ${Math.random() * 0.3 + 0.1})`
      }
    }
    
    // Initialize particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: getParticleColor()
      })
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((particle, i) => {
        particle.x += particle.speedX
        particle.y += particle.speedY
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0
        
        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        )
        gradient.addColorStop(0, particle.color)
        gradient.addColorStop(1, 'transparent')
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Draw core
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
        
        // Connect nearby particles
        particles.slice(i + 1).forEach(other => {
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = particle.color.replace(/[\d.]+\)$/, `${0.1 * (1 - distance / 150)})`)
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [theme])

  const getBackgroundClass = () => {
    switch (theme) {
      case 'cream-gold':
        return 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      case 'deep-luxury':
        return 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
      case 'rose-gold':
        return 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100'
      case 'emerald-luxury':
        return 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
      default:
        return 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }
  }

  const getOrbColors = () => {
    switch (theme) {
      case 'cream-gold':
        return ['from-amber-300/20 to-yellow-300/20', 'from-orange-300/20 to-amber-300/20']
      case 'deep-luxury':
        return ['from-amber-500/10 to-yellow-500/10', 'from-purple-500/10 to-amber-500/10']
      case 'rose-gold':
        return ['from-rose-300/20 to-pink-300/20', 'from-pink-300/20 to-rose-300/20']
      case 'emerald-luxury':
        return ['from-emerald-300/20 to-teal-300/20', 'from-teal-300/20 to-cyan-300/20']
      default:
        return ['from-amber-300/20 to-yellow-300/20', 'from-orange-300/20 to-amber-300/20']
    }
  }

  const orbColors = getOrbColors()

  return (
    <div className={`min-h-screen relative overflow-hidden ${getBackgroundClass()}`}>
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Large floating orbs */}
      <motion.div
        className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-r ${orbColors[0]} blur-3xl`}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-r ${orbColors[1]} blur-3xl`}
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Additional decorative orbs */}
      <motion.div
        className={`absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r ${orbColors[0]} blur-2xl opacity-60`}
        animate={{
          y: [-20, 20, -20],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Canvas for particle network */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default LuxuryBackground
