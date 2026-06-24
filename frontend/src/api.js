import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tally-backend-wfml.onrender.com/api' : 'http://127.0.0.1:5000/api'),
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Catch Paywall Blocks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const errCode = error.response.data?.error;
      if (errCode === 'PAYWALL_ACTIVE' || errCode === 'STUDENT_LIMIT') {
        // Redirect to upgrade screen and pass reason
        window.location.href = `/upgrade?reason=${errCode}`;
      }
    }
    return Promise.reject(error);
  }
);

export const scanReceipt = async (fileName) => {
  const response = await api.post('/accounting/scan-receipt', { fileName });
  return response.data;
};

export const calculateGST = async (amount, rate, isInterstate) => {
  const response = await api.post('/accounting/calculate-gst', { amount, rate, isInterstate });
  return response.data;
};

export const createVoucher = async (voucherData) => {
  const response = await api.post('/vouchers', voucherData);
  return response.data;
};

export default api;
