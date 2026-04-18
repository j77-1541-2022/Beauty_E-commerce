import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: threshold })
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true)
    }
  }, [isInView, hasAnimated])

  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  }

  return {
    ref,
    isInView,
    hasAnimated,
    variants
  }
}

export default useScrollAnimation
