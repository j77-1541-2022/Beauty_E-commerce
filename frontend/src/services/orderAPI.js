import apiClient from './apiClient'

// Order API Service
// Handles customer orders and admin order management

const orderAPI = {
  // Create a new customer order
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/orders/', orderData)
      return response.data
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  },

  // Get customer orders
  getCustomerOrders: async (customerId, params = {}) => {
    try {
      const response = await apiClient.get(`/orders/customer/${customerId}`, { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch customer orders:', error)
      throw error
    }
  },

  // Get all orders (admin)
  getAllOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/orders', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch all orders:', error)
      throw error
    }
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch order details:', error)
      throw error
    }
  },

  // Update order status (admin)
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await apiClient.patch(`/admin/orders/${orderId}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  },

  // Cancel customer order
  cancelOrder: async (orderId) => {
    try {
      const response = await apiClient.patch(`/orders/${orderId}/cancel`)
      return response.data
    } catch (error) {
      console.error('Failed to cancel order:', error)
      throw error
    }
  },

  // Get order statistics (admin)
  getOrderStats: async () => {
    try {
      const response = await apiClient.get('/admin/orders/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch order statistics:', error)
      throw error
    }
  },

  // Process payment for order
  processPayment: async (orderId, paymentData) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/payment`, paymentData)
      return response.data
    } catch (error) {
      console.error('Failed to process payment:', error)
      throw error
    }
  },

  // Get order tracking information
  getOrderTracking: async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}/timeline/`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch order tracking:', error)
      throw error
    }
  },

  // Reorder - add items from delivered order to cart
  reorder: async (orderId) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/reorder/`)
      return response.data
    } catch (error) {
      console.error('Failed to reorder:', error)
      throw error
    }
  }
}

export default orderAPI
