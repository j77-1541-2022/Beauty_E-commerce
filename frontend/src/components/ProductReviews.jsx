import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import reviewsAPI from '../services/reviewsAPI'
import AnimatedButton from './ui/AnimatedButton'

const ProductReviews = ({ productId }) => {
  const { colors, theme } = useTheme()
  const { user } = useCustomerAuth()
  const isDark = theme === 'dark'
  
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState(new Set())
  
  // Write review form state
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await reviewsAPI.getProductReviews(productId)
      setReviews(response.reviews || [])
      setAverageRating(response.average_rating || 0)
      setTotalReviews(response.total_reviews || 0)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please login to write a review')
      return
    }
    
    setSubmitting(true)
    try {
      const result = await reviewsAPI.createReview(productId, rating, title, comment)
      if (result.success) {
        setSubmitSuccess(true)
        setRating(5)
        setTitle('')
        setComment('')
        setShowWriteReview(false)
        fetchReviews()
        setTimeout(() => setSubmitSuccess(false), 3000)
      } else {
        alert(result.error || 'Failed to submit review')
      }
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkHelpful = async (reviewId) => {
    if (!user) {
      alert('Please login to mark reviews as helpful')
      return
    }
    await reviewsAPI.markHelpful(reviewId)
    fetchReviews()
  }

  const toggleExpandReview = (reviewId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const renderStars = (rating, size = 'w-4 h-4') => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach(review => {
      distribution[review.rating - 1]++
    })
    return distribution.map(count => (count / totalReviews) * 100)
  }

  if (loading) {
    return (
      <div className={`p-6 ${colors.card} rounded-xl border ${colors.cardBorder}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${colors.card} rounded-xl border ${colors.cardBorder} overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.cardBorder}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${colors.text} mb-2`}>Customer Reviews</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className={`text-4xl font-bold ${colors.accent}`}>{averageRating}</span>
                <div className="ml-2">
                  <div className="flex">{renderStars(Math.round(averageRating), 'w-5 h-5')}</div>
                  <p className={`text-sm ${colors.textMuted}`}>{totalReviews} reviews</p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const distribution = getRatingDistribution()
                  const percentage = distribution[star - 1]
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className={`text-sm ${colors.textMuted} w-4`}>{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-xs ${colors.textMuted}`}>{Math.round(percentage)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <AnimatedButton
            onClick={() => setShowWriteReview(!showWriteReview)}
            variant="outline"
          >
            Write a Review
          </AnimatedButton>
        </div>
      </div>

      {/* Write Review Form */}
      <AnimatePresence>
        {showWriteReview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-b ${colors.cardBorder} overflow-hidden`}
          >
            <div className="p-6">
              <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Write a Review</h3>
              {submitSuccess && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                  Review submitted successfully! It will be visible after approval.
                </div>
              )}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>Title (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-2 ${colors.input} ${colors.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                    placeholder="Summarize your review"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>Your Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2 ${colors.input} ${colors.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                    placeholder="Share your experience with this product"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <AnimatedButton type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </AnimatedButton>
                  <AnimatedButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowWriteReview(false)}
                  >
                    Cancel
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4 opacity-50`} />
            <p className={colors.textMuted}>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${colors.primary} flex items-center justify-center text-white font-semibold`}>
                    {review.user_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className={`font-medium ${colors.text}`}>{review.user_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(review.rating, 'w-3 h-3')}</div>
                      <p className={`text-xs ${colors.textMuted}`}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                {review.is_featured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    Featured
                  </span>
                )}
              </div>
              
              {review.title && (
                <h4 className={`font-semibold ${colors.text} mb-2`}>{review.title}</h4>
              )}
              
              <p className={`${colors.text} ${expandedReviews.has(review.id) ? '' : 'line-clamp-3'} mb-3`}>
                {review.comment}
              </p>
              
              {review.comment?.length > 150 && (
                <button
                  onClick={() => toggleExpandReview(review.id)}
                  className={`text-sm ${colors.accent} hover:underline mb-3`}
                >
                  {expandedReviews.has(review.id) ? (
                    <>
                      Show less <ChevronUp className="w-4 h-4 inline" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="w-4 h-4 inline" />
                    </>
                  )}
                </button>
              )}
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className={`flex items-center gap-1 text-sm ${colors.textMuted} hover:text-pink-600 transition-colors`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful_count})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ProductReviews
