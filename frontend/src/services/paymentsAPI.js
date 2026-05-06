import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
});

export const paymentsAPI = {
  // Initiate M-Pesa or other payment - data should include { order_id, phone_number, payment_method? }
  initiate: (data) => 
    axios.post(`${API_URL}/v1/payments/initiate/`, data, getAuthHeaders()),
  
  // Get payment status for an order
  getStatus: (orderId) => 
    axios.get(`${API_URL}/v1/payments/status/${orderId}/`, getAuthHeaders()),

  // Record cash payment
  recordCash: (data) =>
    axios.post(`${API_URL}/v1/payments/cash/`, data, getAuthHeaders()),

  // Demo payment endpoint (development only)
  demoPayment: (data) =>
    axios.post(`${API_URL}/v1/payments/demo/`, data, getAuthHeaders()),
};

export default paymentsAPI;
