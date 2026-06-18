import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tally-backend-wfml.onrender.com/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true // Always send cookies
});

// In-memory fallback for cross-domain setups (Vercel -> Render)
// where document.cookie cannot read cross-domain cookies
let memoryCsrfToken = null;

// Helper to extract a cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Intercept responses to aggressively capture any new CSRF tokens from headers
api.interceptors.response.use((response) => {
  const headerCsrf = response.headers['x-csrf-token'];
  if (headerCsrf) {
    memoryCsrfToken = headerCsrf;
  }
  return response;
}, (error) => {
  if (error.response?.headers?.['x-csrf-token']) {
    memoryCsrfToken = error.response.headers['x-csrf-token'];
  }
  return Promise.reject(error);
});

// Attach CSRF token and active company ID to every request
api.interceptors.request.use(config => {
  // Add CSRF token for state-changing requests
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    const csrfToken = getCookie('csrfToken') || memoryCsrfToken;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  const companyId = sessionStorage.getItem('companyId');
  if (companyId) config.headers['x-company-id'] = companyId;
  
  return config;
});

// Token refresh state — prevents duplicate refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle 401 Unauthorized and 403 CSRF errors globally — auto-refresh before failing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // ── CSRF token expired (403) ──────────────────────────────────────
    // The CSRF cookie can expire independently. When it does, the backend
    // returns 403 "CSRF validation failed". We silently refresh tokens to
    // get a fresh CSRF cookie, patch the header, then retry exactly once.
    const isCsrfError =
      error.response?.status === 403 &&
      error.response?.data?.error === 'CSRF validation failed' &&
      !originalRequest._csrfRetry &&
      !originalRequest.url?.includes('/auth/');

      if (isCsrfError) {
        originalRequest._csrfRetry = true;
        try {
          const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
          const freshCsrf = refreshRes.headers['x-csrf-token'] || getCookie('csrfToken') || memoryCsrfToken;
          if (freshCsrf) {
            memoryCsrfToken = freshCsrf;
            originalRequest.headers['X-CSRF-Token'] = freshCsrf;
          }
          return api(originalRequest);
        } catch (_refreshErr) {
          // Refresh failed — fall through to normal reject
        }
      }

    // ── Access token expired (401) ────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh for auth endpoints themselves
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        }).then((token) => {
          // Retry the original request without needing to manually attach a token
          const freshCsrf = getCookie('csrfToken') || memoryCsrfToken;
          if (freshCsrf) {
            originalRequest.headers['X-CSRF-Token'] = freshCsrf;
          }
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        
        if (refreshRes.data) {
          const freshCsrf = refreshRes.headers['x-csrf-token'] || getCookie('csrfToken') || memoryCsrfToken;
          if (freshCsrf) {
            memoryCsrfToken = freshCsrf;
            originalRequest.headers['X-CSRF-Token'] = freshCsrf;
          }
          processQueue(null);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — force logout
        ['companyId', 'companyName'].forEach(k => sessionStorage.removeItem(k));
        const path = window.location.pathname;
        const isPublicPath = path === '/' || path === '/login' || path.startsWith('/auth');
        if (!isPublicPath) {
          window.location.href = '/';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────
export const register = (name, email, password, role) => api.post('/auth/register', { name, email, password, role });
export const login = (email, password) => api.post('/auth/login', { email, password });
export const googleLogin = (credential) => api.post('/auth/google-login', { credential });

/**
 * Called by /auth-callback page after OAuth redirect.
 * The backend set an 'oauthAccessToken' httpOnly cookie containing the access token.
 * This endpoint validates that cookie and sets the full session cookies.
 */
export const exchangeOAuthToken = () => api.post('/auth/oauth-token-exchange', {});
export const getCurrentUser = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

export const authAPI = { register, login, logout, googleLogin, exchangeOAuthToken, getCurrentUser };

// ─── Users ─────────────────────────────────────────
export const usersAPI = {
  getCompanyUsers: () => api.get('/users'),
  inviteUser: (data) => api.post('/users/invite', data),
  updateUserRole: (userId, data) => api.put(`/users/${userId}/role`, data),
  removeUser: (userId) => api.delete(`/users/${userId}`)
};

// ─── Companies ─────────────────────────────────────
export const companyAPI = {
  create: (data) => api.post('/companies', data),
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  getCompanyUsers: () => api.get('/users'),
  syncDefaultLedgers: (id) => api.post(`/companies/${id}/sync-default-ledgers`),
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
  getTransactions: (companyId) => api.get(`/vouchers/transactions/${companyId}`),
  update: (id, data) => api.put(`/vouchers/${id}`, data),
  updateNarration: (id, narration) => api.put(`/vouchers/${id}/narration`, { narration }),
  approve: (id) => api.put(`/vouchers/${id}/approve`),
  cancel: (id) => api.put(`/vouchers/${id}/cancel`),
  delete: (id) => api.delete(`/vouchers/${id}`),
  bulkUpdate: (data) => api.post('/vouchers/bulk-update', data),
};

// ─── Purchase Module ───────────────────────────────
export const purchaseAPI = {
  getVendors: (companyId) => api.get(`/${companyId}/purchases/vendors`),
  getOrders: (companyId) => api.get(`/${companyId}/purchases/orders`),
  createOrder: (data) => api.post(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/orders`, data),
  updateOrder: (id, data) => api.put(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/${sessionStorage.getItem('companyId')}/purchases/orders/${id}`),
  getBills: (companyId) => api.get(`/${companyId}/purchases/bills`),
  createBill: (data) => api.post(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/bills`, data),
  updateBill: (id, data) => api.put(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/bills/${id}`, data),
  getExpenses: (companyId) => api.get(`/${companyId}/purchases/expenses`),
  getNextOrderNumber: (companyId) => api.get(`/${companyId}/purchases/orders/next-number`),
  getPurchaseOrderPdfPreview: (id) => api.get(`/${sessionStorage.getItem('companyId')}/purchases/orders/${id}/pdf-preview`, { responseType: 'blob' }),

  // Legacy support
  getByCompany: (companyId) => api.get(`/${companyId}/purchases/orders`),
  delete: (id) => api.delete(`/${sessionStorage.getItem('companyId')}/purchases/orders/${id}`),
};

export const paymentMadeAPI = {
  getPayments: (companyId) => api.get(`/${companyId}/purchases/payments-made`),
  getPayment: (id) => api.get(`/${sessionStorage.getItem('companyId')}/purchases/payments-made/${id}`),
  create: (data) => api.post(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/payments-made`, data),
  update: (id, data) => api.put(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/payments-made/${id}`, data),
  delete: (id) => api.delete(`/${sessionStorage.getItem('companyId')}/purchases/payments-made/${id}`),
  markAsPaid: (id) => api.patch(`/${sessionStorage.getItem('companyId')}/purchases/payments-made/${id}/mark-paid`),
  getUnpaidBills: (vendorId, companyId, excludePaymentId = null) => api.get(`/${companyId}/purchases/unpaid-bills/${vendorId}`, { params: { excludePaymentId } }),
  getNextNumber: (companyId) => api.get(`/${companyId}/purchases/payments-made/next-number`),
};

export const recurringExpenseAPI = {
  create: (data) => api.post(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/recurring`, data),
  getByCompany: (companyId) => api.get(`/${companyId}/purchases/recurring`),
  update: (id, data) => api.put(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/recurring/${id}`, data),
  delete: (id) => api.delete(`/${sessionStorage.getItem('companyId')}/purchases/recurring/${id}`),
  processDue: () => api.post(`/${sessionStorage.getItem('companyId')}/purchases/recurring/process-due`)
};

export const recurringBillAPI = {
  create: (data) => api.post(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/recurring-bills`, data),
  getByCompany: (companyId) => api.get(`/${companyId}/purchases/recurring-bills`),
  update: (id, data) => api.put(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/recurring-bills/${id}`, data),
  delete: (id) => api.delete(`/${sessionStorage.getItem('companyId')}/purchases/recurring-bills/${id}`),
  processDue: () => api.post(`/${sessionStorage.getItem('companyId')}/purchases/recurring-bills/process-due`)
};

export const vendorCreditAPI = {
  create: (data) => api.post(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/vendor-credits`, data),
  getByCompany: (companyId) => api.get(`/${companyId}/purchases/vendor-credits`),
  getById: (id) => api.get(`/${sessionStorage.getItem('companyId')}/purchases/vendor-credits/${id}`),
  update: (id, data) => api.put(`/${data.companyId || sessionStorage.getItem('companyId')}/purchases/vendor-credits/${id}`, data),
  delete: (id) => api.delete(`/${sessionStorage.getItem('companyId')}/purchases/vendor-credits/${id}`)
};

// ─── Reports ───────────────────────────────────────
export const reportsAPI = {
  trialBalance: (companyId) => api.get(`/reports/trial-balance/${companyId}`),
  profitLoss: (companyId, basis, from, to) => api.get(`/reports/profit-loss/${companyId}`, { params: { basis, from, to } }),
  balanceSheet: (companyId) => api.get(`/reports/balance-sheet/${companyId}`),
  daybook: (companyId, from, to) => api.get(`/reports/daybook/${companyId}`, { params: { from, to } }),
  dashboard: (companyId) => api.get(`/reports/dashboard/${companyId}`),
  ledgerStatement: (ledgerId, from, to) => api.get(`/reports/ledger-statement/${ledgerId}`, { params: { from, to } }),
  auditTrail: (companyId) => api.get(`/reports/audit/${companyId}`),
  cashFlow: (companyId, from, to) => api.get(`/reports/cash-flow/${companyId}`, { params: { from, to } }),
  receivablesReport: (companyId, status) => api.get(`/reports/receivables-report/${companyId}`, { params: { status } }),
  payablesReport: (companyId) => api.get(`/reports/payables-report/${companyId}`),
  inventoryReport: (companyId, params) => api.get(`/reports/inventory-report/${companyId}`, { params }),
  costCenterReport: (companyId) => api.get(`/reports/cost-centers/${companyId}`),
};


// ─── Inventory ───────────────────────────────────────
export const inventoryAPI = {
  createItem: (data) => api.post('/inventory', data),
  getByCompany: (companyId, type) => api.get(`/inventory/${companyId}`, { params: { type } }),
  updateItem: (itemId, data) => api.put(`/inventory/${itemId}`, data),
  updateStock: (itemId, data) => api.post(`/inventory/stock/${itemId}`, data),
  uploadImage: (formData) => api.post('/inventory/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getItemHistory: (id) => api.get(`/inventory/${id}/history`),
  deleteItem: (id) => api.delete(`/inventory/${id}`),

  // Stock Groups
  getStockGroups: (companyId) => api.get(`/inventory/groups/${companyId}`),
  createStockGroup: (data) => api.post('/inventory/groups', data),
  updateStockGroup: (id, data) => api.put(`/inventory/groups/${id}`, data),
  deleteStockGroup: (id) => api.delete(`/inventory/groups/${id}`),

  // Stock Categories
  getStockCategories: (companyId) => api.get(`/inventory/categories/${companyId}`),
  createStockCategory: (data) => api.post('/inventory/categories', data),
  updateStockCategory: (id, data) => api.put(`/inventory/categories/${id}`, data),
  deleteStockCategory: (id) => api.delete(`/inventory/categories/${id}`),

  // Units of Measure
  getUnits: (companyId) => api.get(`/inventory/units/${companyId}`),
  createUnit: (data) => api.post('/inventory/units', data),
  updateUnit: (id, data) => api.put(`/inventory/units/${id}`, data),
  deleteUnit: (id) => api.delete(`/inventory/units/${id}`),

  // Godowns
  getGodowns: (companyId) => api.get(`/inventory/godowns/${companyId}`),
  createGodown: (data) => api.post('/inventory/godowns', data),
  updateGodown: (id, data) => api.put(`/inventory/godowns/${id}`, data),
  deleteGodown: (id) => api.delete(`/inventory/godowns/${id}`),
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
  applyCredit: (data) => api.post('/sales/credits/apply', data),
  getNextNumber: (companyId, type) => api.get(`/sales/next-number/${companyId}/${type}`)
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
  getById: (id) => api.get(`/recurring-invoices/${id}`),
  update: (id, data) => api.put(`/recurring-invoices/${id}`, data),
  delete: (id) => api.delete(`/recurring-invoices/${id}`),
  getHistory: (id) => api.get(`/recurring-invoices/history/${id}`),
  processDue: () => api.post('/recurring-invoices/process-due')
};

export const deliveryChallanAPI = {
  create: (data) => api.post('/delivery-challans', data),
  getByCompany: (companyId) => api.get(`/delivery-challans/company/${companyId}`),
  getById: (id) => api.get(`/delivery-challans/${id}`),
  update: (id, data) => api.put(`/delivery-challans/${id}`, data),
  delete: (id) => api.delete(`/delivery-challans/${id}`),
  sendEmail: (id) => api.post(`/delivery-challans/send-email/${id}`)
};

export const creditNoteAPI = {
  create: (data) => api.post('/credit-notes', data),
  getByCompany: (companyId) => api.get(`/credit-notes/company/${companyId}`),
  getById: (id) => api.get(`/credit-notes/${id}`),
  update: (id, data) => api.put(`/credit-notes/${id}`, data),
  delete: (id) => api.delete(`/credit-notes/${id}`)
};

// ─── Time Tracking ──────────────────────────────────
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getByCompany: (companyId) => api.get(`/projects/${companyId}`),
  getById: (id) => api.get(`/projects/detail/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getPurchases: (id) => api.get(`/projects/${id}/purchases`),
  getSales: (id) => api.get(`/projects/${id}/sales`),
  getActivity: (id) => api.get(`/projects/${id}/activity`),
};

export const timesheetAPI = {
  log: (data) => api.post('/timesheets', data),
  getProjectEntries: (projectId) => api.get(`/timesheets/project/${projectId}`),
  delete: (id) => api.delete(`/timesheets/${id}`)
};


// ─── Cost Centers ──────────────────────────────────
export const costCenterAPI = {
  create: (data) => api.post('/cost-centers', data),
  getByCompany: (companyId) => api.get(`/cost-centers/${companyId}`),
  update: (id, data) => api.put(`/cost-centers/${id}`, data),
  delete: (id) => api.delete(`/cost-centers/${id}`),
};


// ─── Accounting Utilities ──────────────────────────
export const mailAPI = {
  send: (data) => api.post('/mail/send', data),
  getByLedger: (ledgerId) => api.get(`/mail/ledger/${ledgerId}`),
};

export const accountingAPI = {
  calculateGST: (data) => api.post('/accounting/calculate-gst', data),
  scanReceipt: (data) => api.post('/accounting/scan-receipt', data),
};

// ─── Currencies ────────────────────────────────────
export const currencyAPI = {
  getByCompany: (companyId) => api.get(`/currencies/${companyId}`),
  create: (data) => api.post('/currencies', data),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  delete: (id) => api.delete(`/currencies/${id}`),
};

// ─── Cost Categories ───────────────────────────────
export const costCategoryAPI = {
  getByCompany: (companyId) => api.get(`/cost-categories/${companyId}`),
  create: (data) => api.post('/cost-categories', data),
  delete: (id) => api.delete(`/cost-categories/${id}`),
};

// ─── Fixed Assets ──────────────────────────────────
export const fixedAssetsAPI = {
  getByCompany: (companyId) => api.get(`/fixed-assets/${companyId}`),
  create: (data) => api.post('/fixed-assets', data),
  update: (id, data) => api.put(`/fixed-assets/${id}`, data),
  delete: (id) => api.delete(`/fixed-assets/${id}`),
  depreciate: (id, data) => api.post(`/fixed-assets/depreciate/${id}`, data),
  depreciateBatch: (companyId, data) => api.post(`/fixed-assets/depreciate-batch/${companyId}`, data),
  dispose: (id, data) => api.post(`/fixed-assets/dispose/${id}`, data),
};

// ─── Manufacturing / BOM ───────────────────────────
export const manufacturingAPI = {
  getBOMs: (companyId) => api.get(`/manufacturing/bom/${companyId}`),
  createBOM: (data) => api.post('/manufacturing/bom', data),
  deleteBOM: (id) => api.delete(`/manufacturing/bom/${id}`),
  getProductionOrders: (companyId) => api.get(`/manufacturing/orders/${companyId}`),
  createProductionOrder: (data) => api.post('/manufacturing/orders', data),
};

// ─── Budgeting ─────────────────────────────────────
export const budgetAPI = {
  getByCompany: (companyId) => api.get(`/budgets/${companyId}`),
  create: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getVariance: (id) => api.get(`/budgets/variance/${id}`),
};

// ─── Payroll ───────────────────────────────────────
export const payrollAPI = {
  getEmployees: (companyId, params) => api.get(`/payroll/employees/${companyId}`, { params }),
  getEmployeesFiltered: (params) => api.get('/payroll/employees', { params }),
  getEmployeeById: (id) => api.get(`/payroll/employees/detail/${id}`),
  createEmployee: (data) => api.post('/payroll/employees', data),
  updateEmployee: (id, data) => api.put(`/payroll/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/payroll/employees/${id}`),
  reactivateEmployee: (id) => api.post(`/payroll/employees/${id}/reactivate`),
  saveSalaryStructure: (data) => api.post('/payroll/salary-structure', data),
  saveAttendance: (data) => api.post('/payroll/attendance', data),
  getAttendance: (companyId) => api.get(`/payroll/attendance/${companyId}`),
  process: (data) => api.post('/payroll/process', data),
  getPayslips: (companyId) => api.get(`/payroll/payslips/${companyId}`),
  getSettings: (companyId) => api.get(`/payroll/${companyId}/settings`),
  saveSettings: (companyId, data) => api.put(`/payroll/${companyId}/settings`, data),
  validateEmail: (data) => api.post('/payroll/employees/validate/email', data),
  validatePan: (data) => api.post('/payroll/employees/validate/pan', data),
  validateAadhaar: (data) => api.post('/payroll/employees/validate/aadhaar', data),
  uploadPhoto: (id, formData) => api.post(`/payroll/employees/${id}/upload-photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importEmployees: (csvData) => api.post('/payroll/employees/import', { csvData }),
  exportEmployees: () => api.get('/payroll/employees/export', { responseType: 'blob' }),
  exportEmployeePDF: (id) => api.get(`/payroll/employees/${id}/pdf`, { responseType: 'blob' }),
};

// ─── Attendance ─────────────────────────────────────────────
export const attendanceAPI = {
  getAll: (params) => api.get('/attendances', { params }),
  getById: (id) => api.get(`/attendances/${id}`),
  create: (data) => api.post('/attendances', data),
  update: (id, data) => api.put(`/attendances/${id}`, data),
  remove: (id) => api.delete(`/attendances/${id}`),
  approve: (id, data) => api.put(`/attendances/${id}/approve`, data),
  getMonthlySummary: (params) => api.get('/attendances/summary/monthly', { params }),
  bulkImport: (records) => api.post('/attendances/bulk-import', { records }),
  exportCSV: (params) => api.get('/attendances/export', { params, responseType: 'blob' }),
};

// ─── Salary Structures & Assignments ────────────────────────
export const salaryAPI = {
  getComponents: () => api.get('/salary/components'),
  createComponent: (data) => api.post('/salary/components', data),
  updateComponent: (id, data) => api.put(`/salary/components/${id}`, data),
  deleteComponent: (id) => api.delete(`/salary/components/${id}`),
  
  getStructures: () => api.get('/salary/structures'),
  getStructureById: (id) => api.get(`/salary/structures/${id}`),
  createStructure: (data) => api.post('/salary/structures', data),
  updateStructure: (id, data) => api.put(`/salary/structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/salary/structures/${id}`),
  
  getAssignments: () => api.get('/salary/assignments'),
  getEmployeeAssignment: (employeeId) => api.get(`/salary/assignments/employee/${employeeId}`),
  assignSalary: (data) => api.post('/salary/assignments', data),
  deleteAssignment: (id) => api.delete(`/salary/assignments/${id}`),
  
  calculatePreview: (data) => api.post('/salary/calculate-preview', data)
};

// ─── Indian GST Returns ────────────────────────────
export const gstAPI = {
  getGSTR1: (companyId) => api.get(`/tax/gst/gstr1/${companyId}`),
  getGSTR2A: (companyId) => api.get(`/tax/gst/gstr2a/${companyId}`),
  getGSTR3B: (companyId) => api.get(`/tax/gst/gstr3b/${companyId}`),
};

export default api;


