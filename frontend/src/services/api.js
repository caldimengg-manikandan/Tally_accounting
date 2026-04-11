import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and force login if token is invalid/expired
      ['token', 'user', 'companyId'].forEach(k => localStorage.removeItem(k));
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────
export const register = (name, email, password, role) => api.post('/auth/register', { name, email, password, role });
export const login = (email, password) => api.post('/auth/login', { email, password });

export const authAPI = { register, login };

// ─── Companies ─────────────────────────────────────
export const companyAPI = {
  create: (data) => api.post('/companies', data),
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
};

// ─── Groups ────────────────────────────────────────
export const groupAPI = {
  create: (data) => api.post('/groups', data),
  getByCompany: (companyId) => api.get(`/groups/${companyId}`),
  seedStandard: (companyId) => api.post(`/groups/seed/${companyId}`),
  resolveGroups: () => api.get('/groups/resolve'),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

// ─── Ledgers ───────────────────────────────────────
export const ledgerAPI = {
  create: (data) => api.post('/ledgers', data),
  getByCompany: (companyId) => api.get(`/ledgers/${companyId}`),
  getBalance: (ledgerId) => api.get(`/ledgers/balance/${ledgerId}`),
  getTransactions: (ledgerId) => api.get(`/ledgers/transactions/${ledgerId}`),
  update: (id, data) => api.put(`/ledgers/${id}`, data),
  delete: (id) => api.delete(`/ledgers/${id}`),
};

// ─── Vouchers ──────────────────────────────────────
export const voucherAPI = {
  create: (data) => api.post('/vouchers', data),
  getByCompany: (companyId) => api.get(`/vouchers/${companyId}`),
  getById: (id) => api.get(`/vouchers/detail/${id}`),
  delete: (id) => api.delete(`/vouchers/${id}`),
};

// ─── Purchase Module ───────────────────────────────
export const purchaseAPI = {
  getVendors: (companyId) => api.get(`/purchases/vendors/${companyId}`),
  getOrders: (companyId) => api.get(`/purchases/orders/${companyId}`),
  createOrder: (data) => api.post('/purchases/orders', data),
  updateOrder: (id, data) => api.put(`/purchases/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/purchases/orders/${id}`),
  getBills: (companyId) => api.get(`/purchases/bills/${companyId}`),
  getExpenses: (companyId) => api.get(`/purchases/expenses/${companyId}`),
  // Legacy support
  getByCompany: (companyId) => api.get(`/purchases/orders/${companyId}`),
  delete: (id) => api.delete(`/purchases/orders/${id}`),
};

// ─── Reports ───────────────────────────────────────
export const reportsAPI = {
  trialBalance: (companyId) => api.get(`/reports/trial-balance/${companyId}`),
  profitLoss: (companyId) => api.get(`/reports/profit-loss/${companyId}`),
  balanceSheet: (companyId) => api.get(`/reports/balance-sheet/${companyId}`),
  daybook: (companyId, from, to) => api.get(`/reports/daybook/${companyId}`, { params: { from, to } }),
  dashboard: (companyId) => api.get(`/reports/dashboard/${companyId}`),
  ledgerStatement: (ledgerId, from, to) => api.get(`/reports/ledger-statement/${ledgerId}`, { params: { from, to } }),
  auditTrail: (companyId) => api.get(`/reports/audit/${companyId}`),
};

// ─── Inventory ───────────────────────────────────────
export const inventoryAPI = {
  createItem: (data) => api.post('/inventory', data),
  getByCompany: (companyId) => api.get(`/inventory/${companyId}`),
  updateItem: (itemId, data) => api.put(`/inventory/${itemId}`, data),
  updateStock: (itemId, data) => api.post(`/inventory/stock/${itemId}`, data),
  uploadImage: (formData) => api.post('/inventory/upload', formData),
  getItemHistory: (id) => api.get(`/inventory/${id}/history`),
  deleteItem: (id) => api.delete(`/inventory/${id}`),
};

// ─── Price Lists ─────────────────────────────────────
export const priceListAPI = {
  create: (data) => api.post('/pricelists', data),
  getByCompany: (companyId) => api.get(`/pricelists/${companyId}`),
  getById: (id) => api.get(`/pricelists/detail/${id}`),
  update: (id, data) => api.put(`/pricelists/${id}`, data),
  delete: (id) => api.delete(`/pricelists/${id}`),
};

// ─── Bank Reconciliation ──────────────────────────────
export const reconciliationAPI = {
  importStatement: (data) => api.post('/reconciliation/import', data),
  getUnmatched: (companyId) => api.get(`/reconciliation/unmatched/${companyId}`),
  reconcile: (data) => api.post('/reconciliation/reconcile', data),
};

// ─── Sales & Orders ──────────────────────────────────
export const salesAPI = {
  createOrder: (data) => api.post('/sales/orders', data),
  getOrders: (companyId) => api.get(`/sales/orders/${companyId}`),
  updateOrder: (id, data) => api.put(`/sales/orders/${id}`, data),
  createInvoice: (data) => api.post('/sales/invoices', data),
  getInvoicesByCompany: (companyId) => api.get(`/sales/invoices/company/${companyId}`),
  getById: (id) => api.get(`/sales/invoices/detail/${id}`),
  updateInvoice: (id, data) => api.put(`/sales/invoices/${id}`, data),
  deleteOrder: (id) => api.delete(`/sales/orders/${id}`),
  deleteInvoice: (id) => api.delete(`/sales/invoices/${id}`),
  getOpenInvoices: (customerId) => api.get(`/sales/invoices/open/${customerId}`),
  recordPayment: (data) => api.post('/sales/payments/record', data),
  applyCredit: (data) => api.post('/sales/credits/apply', data)
};

// ─── Quotes ────────────────────────────────────────
export const quoteAPI = {
  create: (data) => api.post('/quotes', data),
  getByCompany: (companyId) => api.get(`/quotes/${companyId}`),
  getById: (id) => api.get(`/quotes/detail/${id}`),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  updateStatus: (id, status) => api.patch(`/quotes/${id}/status`, { status }),
  delete: (id) => api.delete(`/quotes/${id}`),
  sendEmail: (id, data) => api.post(`/quotes/send-email/${id}`, data)
};
export const retainerInvoiceAPI = {
  create: (data) => api.post('/retainer-invoices', data),
  getByCompany: (companyId) => api.get(`/retainer-invoices/company/${companyId}`),
  getById: (id) => api.get(`/retainer-invoices/view/${id}`),
  update: (id, data) => api.put(`/retainer-invoices/${id}`, data),
  delete: (id) => api.delete(`/retainer-invoices/${id}`),
  sendEmail: (id, data) => api.post(`/retainer-invoices/send-email/${id}`, data),
  recordPayment: (id, amount) => api.post(`/retainer-invoices/record-payment/${id}`, { amountReceived: amount }),
  applyToInvoice: (id, data) => api.post(`/retainer-invoices/apply-to-invoice/${id}`, data) // { invoiceId, amountToAdjust, CompanyId }
};

export const recurringInvoiceAPI = {
  create: (data) => api.post('/recurring-invoices', data),
  getByCompany: (companyId) => api.get(`/recurring-invoices/company/${companyId}`),
  update: (id, data) => api.put(`/recurring-invoices/${id}`, data),
  delete: (id) => api.delete(`/recurring-invoices/${id}`),
  processDue: () => api.post('/recurring-invoices/process-due')
};

export const deliveryChallanAPI = {
  create: (data) => api.post('/delivery-challans', data),
  getByCompany: (companyId) => api.get(`/delivery-challans/company/${companyId}`),
  getById: (id) => api.get(`/delivery-challans/${id}`),
  update: (id, data) => api.put(`/delivery-challans/${id}`, data),
  delete: (id) => api.delete(`/delivery-challans/${id}`)
};

export const creditNoteAPI = {
  create: (data) => api.post('/credit-notes', data),
  getByCompany: (companyId) => api.get(`/credit-notes/company/${companyId}`),
  getById: (id) => api.get(`/credit-notes/${id}`),
  update: (id, data) => api.put(`/credit-notes/${id}`, data),
  delete: (id) => api.delete(`/credit-notes/${id}`)
};

// ─── Cost Centers ──────────────────────────────────
export const costCenterAPI = {
  create: (data) => api.post('/cost-centers', data),
  getByCompany: (companyId) => api.get(`/cost-centers/${companyId}`),
  delete: (id) => api.delete(`/cost-centers/${id}`),
};

// ─── Accounting Utilities ──────────────────────────
export const accountingAPI = {
  calculateGST: (data) => api.post('/accounting/calculate-gst', data),
  scanReceipt: (data) => api.post('/accounting/scan-receipt', data),
};

export default api;

