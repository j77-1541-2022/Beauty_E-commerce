import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ZoomIn, RotateCw, Check } from 'lucide-react'
import { GlassCard } from './ui/GlassCard'

const ImageUploader = ({
  onImageSelect,
  initialImage = null,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}) => {
  const [image, setImage] = useState(initialImage)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const processFile = async (file) => {
    setError(null)
    
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, or WebP images.')
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`)
      return
    }

    setIsProcessing(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        
        // Resize image if needed
        resizeImage(file)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      setIsProcessing(false)
    }
  }

  const resizeImage = (file) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      
      // Calculate new dimensions (max 1200x1200)
      const maxDimension = 1200
      let width = img.width
      let height = img.height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob((blob) => {
        const resizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        })
        
        setImage(resizedFile)
        onImageSelect(resizedFile)
        setIsProcessing(false)
      }, file.type, 0.9)
    }
    img.onerror = () => {
      setError('Failed to load image. Please try another file.')
      setIsProcessing(false)
    }
    img.src = URL.createObjectURL(file)
  }

  const handleRemove = () => {
    setImage(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageSelect(null)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`w-full ${className}`}>
      <canvas ref={canvasRef} className="hidden" />
      
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {!image ? (
        <GlassCard
          className={`
            relative border-2 border-dashed transition-all duration-300
            ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          hover={true}
        >
          <div className="p-8 text-center">
            <motion.div
              animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragging ? 'Drop your image here' : 'Upload product image'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Max size: {maxSizeMB}MB • JPEG, PNG, WebP
                </p>
              </div>
            </motion.div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="relative overflow-hidden">
          <div className="relative group">
            <img
              src={preview}
              alt="Product preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
              <button
                onClick={handleClick}
                className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Change image"
              >
                <RotateCw className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleRemove}
                className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
                  <p className="text-sm text-gray-600">Processing image...</p>
                </div>
              </div>
            )}

            {/* Success indicator */}
            {!isProcessing && (
              <div className="absolute top-3 right-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 truncate max-w-[200px]">{image.name}</span>
              <span className="text-gray-400">
                {(image.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ImageUploader
