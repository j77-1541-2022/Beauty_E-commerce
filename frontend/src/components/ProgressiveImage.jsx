import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon } from 'lucide-react'

const ProgressiveImage = ({
  src,
  alt,
  className = '',
  placeholder = null,
  blurDataURL = null,
  aspectRatio = 'aspect-square',
  objectFit = 'cover'
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(null)
  const imgRef = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.src = src
    
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoaded(true)
    }
    
    img.onerror = () => {
      setIsError(true)
    }

    // Set placeholder immediately if available
    if (blurDataURL) {
      setCurrentSrc(blurDataURL)
    }
  }, [src, blurDataURL])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setIsError(true)
  }

  if (isError) {
    return (
      <div className={`${aspectRatio} bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${aspectRatio} ${className}`}>
      {/* Placeholder/blur effect */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          {placeholder && (
            <img
              src={placeholder}
              alt={alt}
              className="w-full h-full object-cover filter blur-xl scale-110"
            />
          )}
          {!placeholder && (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Actual image */}
      <motion.img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-${objectFit} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Loading indicator */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}

export default ProgressiveImage
