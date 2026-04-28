import apiClient from './apiClient'
import { resolveProductImage } from '../utils/productImage'

// WebSocket service removed - using REST API only
// import webSocketService from './websocket'

// Enhanced Shop API Service
// Integrates product data with real-time inventory status

const shopAPI = {
  normalizeCategorySlug: (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]/g, ''),

  // Get products with inventory integration
  getProducts: async (params = {}) => {
    try {
      console.log('🛍️ Fetching products with inventory status:', params)
      
      const response = await apiClient.get('/products/admin/products/', {
        params: {
          ...params,
          customer_view: true,
          include_inventory: true,
          include_stock_status: true
        }
      })

      let products = response.results || response

      // Process products to include inventory status
      products = products.map(product => {
        const processedProduct = {
          ...product,
          stock_quantity: product.stock_quantity || 0,
          stock_status: this.getStockStatus(product),
          is_active: product.is_active !== false,
          category: product.category?.name || product.category || 'uncategorized',
          brand_name: product.brand?.name || product.brand_name || 'Unknown Brand'
        }

        // Only show products that are in stock
        return processedProduct
      })

      // Filter out out-of-stock products for customer view
      const inStockProducts = products.filter(product => 
        product.is_active && product.stock_quantity > 0
      )

      console.log(`✅ Processed ${products.length} products, ${inStockProducts.length} in stock`)
      return {
        results: inStockProducts,
        count: inStockProducts.length
      }
    } catch (error) {
      console.error('❌ Failed to fetch products:', error)
      return {
        results: [],
        count: 0
      }
    }
  },

  // Get categories with proper visibility
  getCategories: async () => {
    try {
      console.log('📂 Fetching categories')
      
      const response = await apiClient.get('/products/categories/')
      
      // Handle different response formats
      let categories = Array.isArray(response) ? response : (response.results || [])
      
      if (!Array.isArray(categories)) {
        console.warn('Categories response is not an array:', response)
        categories = []
      }

      // Ensure categories are properly formatted
      categories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        display_name: cat.name?.charAt(0).toUpperCase() + cat.name?.slice(1) || cat.name,
        slug: shopAPI.normalizeCategorySlug(cat.name) || cat.id
      }))

      const requiredCategories = [
        { id: 'skincare', name: 'Skincare', display_name: 'Skincare', slug: 'skincare' },
        { id: 'makeup', name: 'Makeup', display_name: 'Makeup', slug: 'makeup' },
        { id: 'bodycare', name: 'Body Care', display_name: 'Body Care', slug: 'bodycare' },
        { id: 'haircare', name: 'Hair Care', display_name: 'Hair Care', slug: 'haircare' },
        { id: 'treatment', name: 'Treatment', display_name: 'Treatment', slug: 'treatment' },
        { id: 'fragrance', name: 'Fragrance', display_name: 'Fragrance', slug: 'fragrance' }
      ]

      const existingCategorySlugs = new Set(categories.map((cat) => cat.slug))
      const missingCategories = requiredCategories.filter(
        (cat) => !existingCategorySlugs.has(cat.slug)
      )

      categories = [...categories, ...missingCategories]

      // Add default categories if none exist
      if (categories.length === 0) {
        categories = [
          { id: 'skincare', name: 'skincare', display_name: 'Skincare', slug: 'skincare' },
          { id: 'makeup', name: 'makeup', display_name: 'Makeup', slug: 'makeup' },
          { id: 'bodycare', name: 'bodycare', display_name: 'Body Care', slug: 'bodycare' },
          { id: 'haircare', name: 'haircare', display_name: 'Hair Care', slug: 'haircare' },
          { id: 'treatment', name: 'treatment', display_name: 'Treatment', slug: 'treatment' },
          { id: 'fragrance', name: 'fragrance', display_name: 'Fragrance', slug: 'fragrance' }
        ]
      }

      console.log('✅ Categories fetched:', categories)
      return categories
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error)
      // Return default categories on error
      return [
        { id: 'skincare', name: 'skincare', display_name: 'Skincare', slug: 'skincare' },
        { id: 'makeup', name: 'makeup', display_name: 'Makeup', slug: 'makeup' },
        { id: 'bodycare', name: 'bodycare', display_name: 'Body Care', slug: 'bodycare' },
        { id: 'haircare', name: 'haircare', display_name: 'Hair Care', slug: 'haircare' },
        { id: 'treatment', name: 'treatment', display_name: 'Treatment', slug: 'treatment' },
        { id: 'fragrance', name: 'fragrance', display_name: 'Fragrance', slug: 'fragrance' }
      ]
    }
  },

  // Search products with inventory filtering
  searchProducts: async (query, params = {}) => {
    try {
      console.log('🔍 Searching products:', query)
      
      if (!query || query.trim() === '') {
        return shopAPI.getProducts(params)
      }

      const response = await apiClient.get('/products/', {
        params: {
          search: query.trim(),
          ...params
        }
      })

      // Handle different response formats
      const responseData = Array.isArray(response) ? response : (response.results || response)
      let products = Array.isArray(responseData) ? responseData : []
      
      if (!Array.isArray(products)) {
        console.warn('Search response is not an array:', response)
        products = []
      }

      // Process search results to match fetchProducts format
      products = products.map(product => ({
        id: product.id,
        name: product.name || product.product_name,
        description: product.description || product.product_description || '',
        price: product.price || product.selling_price || 0,
        original_price: product.original_price,
        discount: product.discount || 0,
        category: product.category?.name || product.category || 'uncategorized',
        rating: product.rating || 4,
        reviews: product.reviews || 0,
        image: resolveProductImage(product),
        is_active: product.is_active !== false,
        stock_quantity: product.stock_quantity || 0,
        stock_status: shopAPI.getStockStatus(product),
        low_stock_threshold: product.low_stock_threshold || 5,
        dealer_info: product.dealer_info || {
          business_name: product.dealer_name || 'Beauty Store',
          is_verified: product.dealer_verified !== false
        },
        brand: product.brand || 'Beauty Brand',
        sku: product.sku || `SKU-${product.id}`,
        weight: product.weight || 0,
        features: product.features || [],
        last_inventory_update: product.last_stock_update || new Date().toISOString()
      }))

      // Filter out out-of-stock products
      const inStockProducts = products.filter(product => 
        product.is_active && product.stock_quantity > 0
      )

      console.log(`✅ Search found ${products.length} products, ${inStockProducts.length} in stock`)
      return {
        results: inStockProducts,
        count: inStockProducts.length
      }
    } catch (error) {
      console.error('❌ Failed to search products:', error)
      return {
        results: [],
        count: 0
      }
    }
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    try {
      console.log('📂 Fetching products by category:', category)
      
      const response = await apiClient.get('/products/admin/products/', {
        params: {
          category__name__iexact: category,
          customer_view: true,
          include_inventory: true,
          include_stock_status: true,
          ...params
        }
      })

      // Handle different response formats
      let products = Array.isArray(response) ? response : (response.results || [])
      
      if (!Array.isArray(products)) {
        console.warn('Category response is not an array:', response)
        products = []
      }

      // Process category products to match fetchProducts format
      products = products.map(product => ({
        id: product.id,
        name: product.name || product.product_name,
        description: product.description || product.product_description || '',
        price: product.price || product.selling_price || 0,
        original_price: product.original_price,
        discount: product.discount || 0,
        category: product.category?.name || product.category || 'uncategorized',
        rating: product.rating || 4,
        reviews: product.reviews || 0,
        image: resolveProductImage(product),
        is_active: product.is_active !== false,
        stock_quantity: product.stock_quantity || 0,
        stock_status: shopAPI.getStockStatus(product),
        low_stock_threshold: product.low_stock_threshold || 5,
        dealer_info: product.dealer_info || {
          business_name: product.dealer_name || 'Beauty Store',
          is_verified: product.dealer_verified !== false
        },
        brand: product.brand || 'Beauty Brand',
        sku: product.sku || `SKU-${product.id}`,
        weight: product.weight || 0,
        features: product.features || [],
        last_inventory_update: product.last_stock_update || new Date().toISOString()
      }))

      // Filter out out-of-stock products
      const inStockProducts = products.filter(product => 
        product.is_active && product.stock_quantity > 0
      )

      console.log(`✅ Category "${category}" found ${products.length} products, ${inStockProducts.length} in stock`)
      return {
        results: inStockProducts,
        count: inStockProducts.length
      }
    } catch (error) {
      console.error('❌ Failed to fetch products by category:', error)
      return {
        results: [],
        count: 0
      }
    }
  },

  // Get single product with inventory
  getProduct: async (id) => {
    try {
      console.log('🔍 Fetching product:', id)
      
      const response = await apiClient.get(`/products/admin/products/${id}/`, {
        params: {
          customer_view: true,
          include_inventory: true,
          include_stock_status: true
        }
      })

      const product = {
        ...response,
        stock_quantity: response.stock_quantity || 0,
        stock_status: this.getStockStatus(response),
        is_active: response.is_active !== false,
        category: response.category?.name || response.category || 'uncategorized'
      }

      console.log('✅ Product fetched:', product)
      return product
    } catch (error) {
      console.error('❌ Failed to fetch product:', error)
      throw error
    }
  },

  // Helper method to determine stock status
  getStockStatus: (product) => {
    const quantity = product.stock_quantity || 0
    
    if (quantity <= 0) {
      return 'out_of_stock'
    } else if (quantity <= 5) {
      return 'low_stock'
    } else {
      return 'in_stock'
    }
  },

  // Initialize WebSocket for real-time updates
  // DISABLED: Django backend doesn't support WebSocket/Socket.IO
  // Products load via REST API which is fully functional
  initializeRealTimeUpdates: (callback) => {
    console.log('ℹ️ WebSocket real-time updates disabled - using REST API only')
    // No-op: WebSocket not needed, HTTP API handles all cart operations
  },

  // Cleanup WebSocket
  // DISABLED: No WebSocket connection to clean up
  cleanupRealTimeUpdates: () => {
    // No-op: No active WebSocket connection
  }
}

export default shopAPI
