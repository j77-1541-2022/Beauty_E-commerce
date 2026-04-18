/**
 * Centralized API Client - Section H1
 * Axios instance with interceptors for token handling and refresh queue
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token refresh queue to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    // Start token refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/users/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      
      // Update header for original request
      originalRequest.headers.Authorization = `Bearer ${access}`;
      
      // Notify subscribers
      onTokenRefreshed(access);
      isRefreshing = false;

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      isRefreshing = false;
      refreshSubscribers = [];
      
      window.location.href = '/login?session_expired=true';
      return Promise.reject(refreshError);
    }
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => {
    // Transform identifier into email or username for backend
    const { identifier, password } = credentials;
    const payload = identifier.includes('@')
      ? { email: identifier, password }
      : { username: identifier, password };
    return apiClient.post('/users/auth/token/', payload);
  },
  register: (data) => apiClient.post('/users/auth/register/', data),
  logout: () => apiClient.post('/users/auth/logout/'),
  refresh: (token) => apiClient.post('/users/auth/token/refresh/', { refresh: token }),
  getProfile: () => apiClient.get('/users/profile/'),
  updateProfile: (data) => apiClient.patch('/users/profile/', data),
};

export const productAPI = {
  getAll: (params) => apiClient.get('/products/', { params }),
  getById: (id) => apiClient.get(`/products/${id}/`),
  create: (data) => apiClient.post('/products/', data),
  update: (id, data) => apiClient.patch(`/products/${id}/`, data),
  delete: (id) => apiClient.delete(`/products/${id}/`),
  uploadImage: (id, formData) => apiClient.post(`/products/${id}/upload_image/`, formData),
  getCategories: () => apiClient.get('/products/categories/').then((response) => response.data),
  getBrands: () => apiClient.get('/products/brands/').then((response) => response.data),
};

// Alias for files using productsAPI
export const productsAPI = productAPI;

export const orderAPI = {
  getAll: (params) => apiClient.get('/orders/', { params }),
  getById: (id) => apiClient.get(`/orders/${id}/`),
  create: (data) => apiClient.post('/orders/', data),
  update: (id, data) => apiClient.put(`/orders/${id}/`, data),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/`, { status }),
  confirmOrder: (id) => apiClient.post(`/orders/${id}/confirm_order/`),
  createFromCart: () => apiClient.post('/orders/create_from_cart/'),
  getReceipt: (id) => apiClient.get(`/orders/${id}/receipt/`),
  getStatistics: () => apiClient.get('/orders/statistics/'),
};

export const inventoryAPI = {
  getAll: (params) => apiClient.get('/inventory/', { params }),
  getById: (id) => apiClient.get(`/inventory/${id}/`),
  stockIn: (id, data) => apiClient.post(`/inventory/${id}/stock_in/`, data),
  stockOut: (id, data) => apiClient.post(`/inventory/${id}/stock_out/`, data),
  getMovements: (id) => apiClient.get(`/inventory/${id}/movements/`),
  getLowStock: () => apiClient.get('/inventory/low_stock/'),
  getOutOfStock: () => apiClient.get('/inventory/out_of_stock/'),
  getSuppliers: () => apiClient.get('/inventory/suppliers/'),
  createSupplier: (data) => apiClient.post('/inventory/suppliers/', data),
};

export const cartAPI = {
  getCart: () => apiClient.get('/cart/'),
  addItem: (data) => apiClient.post('/cart/items/', data),
  updateItem: (id, data) => apiClient.patch(`/cart/items/${id}/`, data),
  removeItem: (id) => apiClient.delete(`/cart/items/${id}/`),
  clearCart: () => apiClient.delete('/cart/clear/'),
};

export const paymentAPI = {
  initiate: (data) => apiClient.post('/payments/initiate/', data),
  getStatus: (orderId) => apiClient.get(`/payments/status/${orderId}/`),
  recordCash: (data) => apiClient.post('/payments/cash/', data),
};

export const dealerAPI = {
  getDashboard: () => apiClient.get('/dealer/dashboard/'),
  getOrders: (params) => apiClient.get('/dealer/orders/', { params }),
  updateOrderStatus: (orderId, status) => apiClient.patch(`/dealer/${orderId}/order_status/`, { status }),
  getProducts: () => apiClient.get('/dealer/products/'),
  createProduct: (data) => apiClient.post('/dealer/products/', data),
  updateProduct: (id, data) => apiClient.patch(`/dealer/${id}/products/`, data),
  deleteProduct: (id) => apiClient.delete(`/dealer/products/${id}/`),
  uploadProductImage: (id, formData) => apiClient.post(`/products/${id}/upload_image/`, formData),
  createInventory: (data) => apiClient.post('/dealer/inventory/', data),
  getInventory: () => apiClient.get('/dealer/inventory/'),
  updateInventory: (id, data) => apiClient.patch(`/dealer/inventory/${id}/`, data),
  getEarnings: () => apiClient.get('/dealer/earnings/'),
  getProfile: () => apiClient.get('/dealer/profile/'),
  updateProfile: (data) => apiClient.patch('/dealer/profile/', data),
  contactSupport: (data) => apiClient.post('/dealer/contact_support/', data),
  // Reports endpoints
  getInventoryReport: () => apiClient.get('/dealer/reports_inventory/'),
  getLowStockReport: () => apiClient.get('/dealer/reports_low_stock/'),
  getStockMovementReport: (params) => apiClient.get('/dealer/reports_stock_movement/', { params }),
  getValuationReport: () => apiClient.get('/dealer/reports_valuation/'),
  // Analytics/DSS endpoints
  getDemandForecast: (productId) => apiClient.get('/dealer/analytics_forecast/', { params: productId ? { product_id: productId } : {} }),
  getABCAnalysis: () => apiClient.get('/dealer/analytics_abc/'),
  getEOQ: (productId, params = {}) => apiClient.get('/dealer/analytics_eoq/', { params: productId ? { product_id: productId, ...params } : params }),
  getReorderRecommendations: () => apiClient.get('/dealer/analytics_reorder_recommendations/'),
  // Dashboard charts data
  getDashboardCharts: () => apiClient.get('/dealer/dashboard_charts/'),
};

export const notificationAPI = {
  getPreferences: () => apiClient.get('/notifications/preferences/'),
  updatePreferences: (data) => apiClient.patch('/notifications/preferences/', data),
  getDealerNotifications: (params = {}) => apiClient.get('/notifications/dealer/', { params }),
  markAsRead: (id) => apiClient.post(`/notifications/dealer/${id}/read/`),
  markAllAsRead: () => apiClient.post('/notifications/dealer/read-all/'),
};

export const analyticsAPI = {
  getOverview: () => apiClient.get('/analytics/overview/'),
  getSales: (params) => apiClient.get('/analytics/sales/', { params }),
  getProducts: (params) => apiClient.get('/analytics/products/', { params }),
  getCustomers: () => apiClient.get('/analytics/customers/'),
};

export const auditAPI = {
  getLogs: (params) => apiClient.get('/audit/audit-logs/', { params }),
  getStatistics: (params) => apiClient.get('/audit/audit-logs/statistics/', { params }),
  getRecentActivity: (limit = 20) => apiClient.get(`/audit/audit-logs/recent_activity/?limit=${limit}`),
};

export default apiClient;
