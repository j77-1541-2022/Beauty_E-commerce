import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          })

          const { access } = response.data
          localStorage.setItem('accessToken', access)

          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/token/', credentials),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getUser: () => api.get('/users/profile/'),
}

export const productsAPI = {
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/products/', { params })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getBrands: async () => {
    try {
      const response = await api.get('/products/brands/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getProduct: async (id) => {
    try {
      const response = await api.get(`/products/${id}/`)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  createProduct: async (data) => {
    try {
      const response = await api.post('/products/', data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  updateProduct: async (id, data) => {
    try {
      const response = await api.put(`/products/${id}/`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}/`)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getBrands: async () => {
    try {
      const response = await api.get('/products/brands/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  searchProducts: async (query) => {
    try {
      const response = await api.get('/products/search/', { params: { q: query } })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  uploadImage: async (id, formData) => {
    try {
      const response = await api.post(`/products/${id}/upload_image/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
}

export const inventoryAPI = {
  getInventory: async (params = {}) => {
    try {
      const response = await api.get('/inventory/', { params })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getInventoryItem: async (id) => {
    try {
      const response = await api.get(`/inventory/${id}/`)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  updateInventory: async (id, data) => {
    try {
      const response = await api.put(`/inventory/${id}/`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  stockIn: async (id, data) => {
    try {
      const response = await api.post(`/inventory/${id}/stock_in/`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  stockOut: async (id, data) => {
    try {
      const response = await api.post(`/inventory/${id}/stock_out/`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getLowStock: async () => {
    try {
      const response = await api.get('/inventory/low_stock/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getOutOfStock: async () => {
    try {
      const response = await api.get('/inventory/out_of_stock/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getMovements: async (params = {}) => {
    try {
      const response = await api.get('/inventory/movements/', { params })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getSuppliers: async () => {
    try {
      const response = await api.get('/inventory/suppliers/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  createSupplier: async (data) => {
    try {
      const response = await api.post('/inventory/suppliers/', data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
}

export const ordersAPI = {
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders/', { params })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getOrder: async (id) => {
    try {
      const response = await api.get(`/orders/${id}/`)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  createOrder: async (data) => {
    try {
      const response = await api.post('/orders/', data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  updateOrder: async (id, data) => {
    try {
      const response = await api.put(`/orders/${id}/`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  updateStatus: async (id, data) => {
    try {
      const response = await api.post(`/orders/${id}/update_status/`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  confirmOrder: async (id) => {
    try {
      const response = await api.post(`/orders/${id}/confirm_order/`)
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getStatistics: async () => {
    try {
      const response = await api.get('/orders/statistics/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
}

export const analyticsAPI = {
  getDashboard: async () => {
    try {
      const response = await api.get('/analytics/dashboard/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getInventoryInsights: async () => {
    try {
      const response = await api.get('/analytics/inventory_insights/')
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
  getSalesReport: async (days) => {
    try {
      const response = await api.get('/analytics/sales_report/', { params: { days } })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
      throw error
    }
  },
}

export default api
