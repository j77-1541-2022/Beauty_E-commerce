import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
});

export const paymentsAPI = {
  initiate: (orderId, phoneNumber) => 
    axios.post(`${API_URL}/payments/initiate/`, { order_id: orderId, phone_number: phoneNumber }, getAuthHeaders()),
  
  getStatus: (orderId) => 
    axios.get(`${API_URL}/payments/status/${orderId}/`, getAuthHeaders()),

  recordCash: (data) =>
    axios.post(`${API_URL}/payments/cash/`, data, getAuthHeaders()),
};

export default paymentsAPI;
