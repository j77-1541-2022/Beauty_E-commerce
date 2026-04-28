import apiClient from './apiClient'

const reviewsAPI = {
  // Get reviews for a product
  getProductReviews: async (productId) => {
    try {
      const response = await apiClient.get(`/reviews/product_reviews/?product_id=${productId}`)
      return response
    } catch (error) {
      console.error('❌ Failed to fetch reviews:', error)
      return { reviews: [], average_rating: 0, total_reviews: 0 }
    }
  },

  // Create a new review
  createReview: async (productId, rating, title, comment) => {
    try {
      const response = await apiClient.post('/reviews/', {
        product: productId,
        rating,
        title,
        comment
      })
      return { success: true, data: response }
    } catch (error) {
      console.error('❌ Failed to create review:', error)
      if (error.response?.data?.detail?.includes('unique constraint')) {
        return { success: false, error: 'You have already reviewed this product' }
      }
      return { success: false, error: error.response?.data?.detail || 'Failed to submit review' }
    }
  },

  // Get current user's reviews
  getMyReviews: async () => {
    try {
      const response = await apiClient.get('/reviews/my_reviews/')
      return response
    } catch (error) {
      console.error('❌ Failed to fetch my reviews:', error)
      return []
    }
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/helpful/`)
      return { success: true, helpful_count: response.helpful_count }
    } catch (error) {
      console.error('❌ Failed to mark helpful:', error)
      return { success: false }
    }
  }
}

export default reviewsAPI
