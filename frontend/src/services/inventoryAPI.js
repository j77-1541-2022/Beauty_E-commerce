import apiClient from './apiClient'

// Live Inventory API Service
// Single source of truth for all product inventory data

const inventoryAPI = {
  // Get all products (admin + dealer) with inventory and dealer info
  getProducts: async (params = {}) => {
    try {
      console.log('🔍 Fetching all products:', params)
      // Fetch from main products endpoint - includes both admin and dealer products
      const response = await apiClient.get('/products/', {
        params: {
          ...params,
          is_active: true
        }
      })
      console.log('✅ Products response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch products:', error)
      throw error
    }
  },

  // Get all available products (admin + dealer) for customer view
  getAvailableProducts: async (params = {}) => {
    try {
      console.log('🛍️ Fetching available products:', params)
      // Fetch from main products endpoint - includes both admin and dealer products
      const response = await apiClient.get('/products/', {
        params: {
          ...params,
          is_active: true
        }
      })
      console.log('✅ Available products response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch available products:', error)
      throw error
    }
  },

  // Get products with dealer/admin inventory status from admin endpoint
  getProductsWithInventoryStatus: async (params = {}) => {
    try {
      console.log('📊 Fetching products with inventory status from admin:', params)
      const response = await apiClient.get('/products/admin/products/', {
        params: {
          ...params,
          include_inventory_status: true,
          include_dealer_info: true,
          include_stock_status: true,
          include_admin_inventory: true,
          fetch_from_dealer_inventory: true,
          fetch_from_admin_inventory: true,
          customer_view: true // Customer perspective
        }
      })
      console.log('✅ Products with inventory status response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch products with dealer/admin inventory status:', error)
      throw error
    }
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      console.log('📈 Fetching inventory statistics')
      // Use the main products endpoint - includes both admin and dealer
      const response = await apiClient.get('/products/', {
        params: { is_active: true }
      })

      // Calculate stats from products
      const products = response.results || response
      const stats = {
        total_products: products.length,
        in_stock: products.filter(p => p.is_active && (p.stock_quantity > 0 || p.stock_status === 'in_stock')).length,
        low_stock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
        out_of_stock: products.filter(p => p.stock_quantity === 0 || p.stock_status === 'out_of_stock').length,
        total_value: products.reduce((sum, p) => sum + (p.price || p.selling_price || 0), 0)
      }

      console.log('✅ Inventory stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('❌ Failed to fetch inventory statistics:', error)
      // Return default stats if API fails
      return {
        total_products: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0
      }
    }
  },

  // Search products (admin + dealer)
  searchProducts: async (query, params = {}) => {
    try {
      console.log('🔍 Searching products:', query)
      const response = await apiClient.get('/products/', {
        params: {
          ...params,
          search: query,
          is_active: true
        }
      })
      console.log('✅ Search results:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to search products:', error)
      throw error
    }
  },

  // Get product by ID (admin or dealer)
  getProduct: async (id) => {
    try {
      console.log('🔍 Fetching product:', id)
      const response = await apiClient.get(`/products/${id}/`)
      console.log('✅ Product response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch product:', error)
      throw error
    }
  },

  // Inventory helpers for processing product data
  inventoryHelpers: {
    // Get current stock quantity
    getCurrentStockQuantity: (product) => {
      return product.stock_quantity || 0
    },

    // Get stock status
    getStockStatus: (product) => {
      return product.stock_status || 'out_of_stock'
    },

    // Check if product is in stock
    isInStock: (product) => {
      const quantity = product.stock_quantity || 0
      return quantity > 0
    },

    // Check if product is low stock
    isLowStock: (product) => {
      const quantity = product.stock_quantity || 0
      const threshold = product.low_stock_threshold || 5
      return quantity > 0 && quantity <= threshold
    },

    // Get formatted price
    getFormattedPrice: (product, currency = 'KSH') => {
      const price = product.price || product.selling_price || 0
      return `${currency} ${price.toLocaleString()}`
    },

    // Get discount percentage
    getDiscountPercentage: (product) => {
      if (!product.discount || product.discount <= 0) return 0
      return product.discount
    },

    // Get original price
    getOriginalPrice: (product) => {
      return product.original_price || product.selling_price || 0
    },

    // Check if product has discount
    hasDiscount: (product) => {
      return product.discount && product.discount > 0 && product.original_price
    }
  }
}

export default inventoryAPI
