import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tally-backend-wfml.onrender.com/api' : 'http://127.0.0.1:5000/api'),
});

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
