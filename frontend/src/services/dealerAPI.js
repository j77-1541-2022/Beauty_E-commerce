import apiClient from './apiClient'

const dealerAPI = {
  getProfile: () => apiClient.get('/dealer/profile/'),
  updateProfile: (data) => apiClient.patch('/dealer/profile/', data),
  getProducts: () => apiClient.get('/dealer/products/'),
  updateProduct: (id, data) => apiClient.patch(`/dealer/products/${id}/products/`, data),
  getPayouts: () => apiClient.get('/dealer/payouts/'),
  requestPayout: () => apiClient.post('/dealer/request_payout/'),
}

export default dealerAPI
