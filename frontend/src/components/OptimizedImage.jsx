import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  loading = 'lazy',
  fallback = '/images/placeholders/skincare.svg'
}) => {
  const { colors } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    if (img) {
      img.complete ? setIsLoaded(true) : setIsLoaded(false)
    }
  }, [src])

  const handleError = (e) => {
    if (!error) {
      setError(true)
      e.target.src = fallback
    }
  }

  const handleLoad = () => {
    setIsLoaded(true)
    setError(false)
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 animate-pulse ${colors.card}`}
          style={{ backgroundColor: colors.card }}
        />
      )}
      
      <img
        ref={imgRef}
        src={error ? fallback : src}
        alt={alt}
        loading={loading}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={{ objectFit: 'cover' }}
        decoding="async"
      />
    </div>
  )
}

export default OptimizedImage
