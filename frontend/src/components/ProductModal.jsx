import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Heart, ShoppingCart, Star, Package, Truck, Shield, 
  ChevronLeft, ChevronRight, Share2, AlertCircle, ThumbsUp,
  MessageSquare, Send
} from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import reviewsAPI from '../services/reviewsAPI'
import { GlassCard } from './ui/GlassCard'
import AnimatedButton from './ui/AnimatedButton'
import { getProductPlaceholder } from '../utils/productImage'

const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const { formatPrice } = useCurrency()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { user } = useCustomerAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  
  // Reviews state
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && product) {
      fetchReviews()
    }
  }, [isOpen, product])

  const fetchReviews = async () => {
    if (!product) return
    setLoadingReviews(true)
    try {
      const data = await reviewsAPI.getProductReviews(product.id)
      setReviews(data.reviews || [])
      setAvgRating(data.average_rating || 0)
      setTotalReviews(data.total_reviews || 0)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please login to submit a review')
      return
    }
    setSubmittingReview(true)
    try {
      const result = await reviewsAPI.createReview(
        product.id,
        newReview.rating,
        newReview.title,
        newReview.comment
      )
      if (result.success) {
        setShowReviewForm(false)
        setNewReview({ rating: 5, title: '', comment: '' })
        fetchReviews()
        alert('Review submitted successfully! It will appear after admin approval.')
      } else {
        alert(result.error || 'Failed to submit review')
      }
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleMarkHelpful = async (reviewId) => {
    const result = await reviewsAPI.markHelpful(reviewId)
    if (result.success) {
      fetchReviews()
    }
  }

  if (!product) return null

  const categoryLabel =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name || product.category?.slug || 'N/A'

  const brandLabel =
    typeof product.brand === 'string'
      ? product.brand
      : product.brand?.name || product.brand?.slug || 'N/A'

  // Handle image navigation
  const nextImage = () => {
    const images = [product.image, ...(product.additional_images || [])]
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    const images = [product.image, ...(product.additional_images || [])]
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const images = [product.image, ...(product.additional_images || [])]
  const currentImage = images[currentImageIndex]

  const handleAddToCart = () => {
    onAddToCart(product.id)
    onClose()
  }

  const handleToggleWishlist = () => {
    toggleWishlist(product)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Product Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="relative">
                  <div className="relative h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden">
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getProductPlaceholder(product)
                      }}
                    />

                    {/* Image Navigation */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Image Indicators */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        product.stock_status === 'in_stock'
                          ? 'bg-green-500 text-white'
                          : product.stock_status === 'low_stock'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {product.stock_status === 'in_stock' 
                          ? 'In Stock' 
                          : product.stock_status === 'low_stock'
                          ? `Low Stock (${product.stock_quantity})`
                          : 'Out of Stock'
                        }
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {product.discount > 0 && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          -{product.discount}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Gallery */}
                  {images.length > 1 && (
                    <div className="flex space-x-2 mt-4">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden transition-opacity ${
                            index === currentImageIndex
                              ? 'opacity-100 ring-2 ring-purple-500'
                              : 'opacity-60 hover:opacity-80'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="p-6">
                  {/* Dealer Information */}
                  {product.dealer_info && (
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          product.dealer_info.is_verified 
                            ? 'bg-green-400' 
                            : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-purple-200">
                          {product.dealer_info.business_name}
                          {product.dealer_info.is_verified && ' ✓'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Product Name */}
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {product.name}
                  </h2>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(avgRating || product.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-purple-300">
                      {avgRating || product.rating || 0} ({totalReviews || product.reviews || 0} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-white">
                        {formatPrice(
                          product.discount > 0
                            ? product.price * (1 - product.discount / 100)
                            : product.price
                        )}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-lg line-through text-purple-400">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    {product.discount > 0 && (
                      <div className="mt-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                          Save {formatPrice(
                            product.price - (product.price * (1 - product.discount / 100))
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Description
                    </h3>
                    <p className="text-purple-200 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Features
                      </h3>
                      <ul className="space-y-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-purple-200 text-sm">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Product Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Category:</span>
                        <span className="text-white capitalize">{categoryLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Brand:</span>
                        <span className="text-white">{brandLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">SKU:</span>
                        <span className="text-white">{product.sku}</span>
                      </div>
                      {product.weight && (
                        <div className="flex justify-between">
                          <span className="text-purple-300">Weight:</span>
                          <span className="text-white">{product.weight}g</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="mb-6 p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">
                        Stock Information
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Status:</span>
                        <span className="text-white capitalize">{product.stock_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Available:</span>
                        <span className="text-white">{product.stock_quantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Last Updated:</span>
                        <span className="text-white">
                          {new Date(product.last_inventory_update).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Returns */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Shipping & Returns
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-200">
                          Free shipping on orders over KSh 5,000
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-200">
                          30-day return policy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <AnimatedButton
                      onClick={handleAddToCart}
                      size="lg"
                      className="flex-1"
                      disabled={product.stock_status !== 'in_stock'}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {product.stock_status === 'in_stock' ? 'Add to Cart' : 'Out of Stock'}
                    </AnimatedButton>

                    <AnimatedButton
                      onClick={handleToggleWishlist}
                      variant="outline"
                      size="lg"
                      className="p-3"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isInWishlist(product.id) ? 'fill-current' : ''
                        }`}
                      />
                    </AnimatedButton>

                    <AnimatedButton
                      onClick={handleShare}
                      variant="outline"
                      size="lg"
                      className="p-3"
                    >
                      <Share2 className="w-5 h-5" />
                    </AnimatedButton>
                  </div>

                  {/* Stock Alert */}
                  {product.stock_status === 'low_stock' && (
                    <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-orange-300">
                          Only {product.stock_quantity} units left in stock!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reviews Section */}
                  <div className="mt-8 border-t border-white/20 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Customer Reviews ({totalReviews})
                      </h3>
                      <AnimatedButton
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        variant="outline"
                        size="sm"
                      >
                        {showReviewForm ? 'Cancel' : 'Write Review'}
                      </AnimatedButton>
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-white/5 rounded-lg">
                        <div className="mb-4">
                          <label className="block text-sm text-purple-200 mb-2">Rating</label>
                          <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= newReview.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-400'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm text-purple-200 mb-2">Title (optional)</label>
                          <input
                            type="text"
                            value={newReview.title}
                            onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-purple-300"
                            placeholder="Short summary of your review"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm text-purple-200 mb-2">Review</label>
                          <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-purple-300 h-24 resize-none"
                            placeholder="Share your experience with this product..."
                            required
                          />
                        </div>
                        <AnimatedButton
                          type="submit"
                          size="sm"
                          disabled={submittingReview || !newReview.comment.trim()}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </AnimatedButton>
                      </form>
                    )}

                    {/* Reviews List */}
                    {loadingReviews ? (
                      <div className="text-center py-4">
                        <span className="text-purple-300">Loading reviews...</span>
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {reviews.map((review) => (
                          <div key={review.id} className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-white">
                                    {review.user_name || review.user?.username || 'Anonymous'}
                                  </span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-400'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {review.title && (
                                  <p className="text-sm font-medium text-purple-200 mt-1">{review.title}</p>
                                )}
                              </div>
                              <span className="text-xs text-purple-400">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-purple-200 mb-3">{review.comment}</p>
                            <button
                              onClick={() => handleMarkHelpful(review.id)}
                              className="flex items-center space-x-1 text-xs text-purple-400 hover:text-white transition-colors"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Helpful ({review.helpful_count})</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-purple-300">No reviews yet. Be the first to review!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProductModal
