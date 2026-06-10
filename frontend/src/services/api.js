import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tally-backend-wfml.onrender.com/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE
});

// Attach JWT token and active company ID to every request
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  const companyId = sessionStorage.getItem('companyId');
  if (companyId) config.headers['x-company-id'] = companyId;
  
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and force login if token is invalid/expired
      ['token', 'user', 'companyId', 'companyName'].forEach(k => sessionStorage.removeItem(k));
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
export const googleLogin = (credential) => api.post('/auth/google-login', { credential });

export const authAPI = { register, login, googleLogin };

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
  getVendors: (companyId) => api.get(`/purchases/vendors/${companyId}`),
  getOrders: (companyId) => api.get(`/purchases/orders/${companyId}`),
  createOrder: (data) => api.post('/purchases/orders', data),
  updateOrder: (id, data) => api.put(`/purchases/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/purchases/orders/${id}`),
  getBills: (companyId) => api.get(`/purchases/bills/${companyId}`),
  createBill: (data) => api.post('/purchases/bills', data),
  updateBill: (id, data) => api.put(`/purchases/bills/${id}`, data),
  getExpenses: (companyId) => api.get(`/purchases/expenses/${companyId}`),
  getNextOrderNumber: (companyId) => api.get(`/purchases/orders/next-number/${companyId}`),
  // Legacy support
  getByCompany: (companyId) => api.get(`/purchases/orders/${companyId}`),
  delete: (id) => api.delete(`/purchases/orders/${id}`),
};

export const paymentMadeAPI = {
  getPayments: (companyId) => api.get(`/purchases/payments-made/${companyId}`),
  getPayment: (id) => api.get(`/purchases/payments-made/payment/${id}`),
  create: (data) => api.post('/purchases/payments-made', data),
  update: (id, data) => api.put(`/purchases/payments-made/${id}`, data),
  delete: (id) => api.delete(`/purchases/payments-made/${id}`),
  markAsPaid: (id) => api.patch(`/purchases/payments-made/${id}/mark-paid`),
  getUnpaidBills: (vendorId, companyId, excludePaymentId = null) => api.get(`/purchases/unpaid-bills/${vendorId}`, { params: { companyId, excludePaymentId } }),
  getNextNumber: (companyId) => api.get(`/purchases/payments-made/next-number/${companyId}`),
};

export const recurringExpenseAPI = {
  create: (data) => api.post('/purchases/recurring', data),
  getByCompany: (companyId) => api.get(`/purchases/recurring/${companyId}`),
  update: (id, data) => api.put(`/purchases/recurring/${id}`, data),
  delete: (id) => api.delete(`/purchases/recurring/${id}`),
  processDue: () => api.post('/purchases/recurring/process-due')
};

export const recurringBillAPI = {
  create: (data) => api.post('/purchases/recurring-bills', data),
  getByCompany: (companyId) => api.get(`/purchases/recurring-bills/${companyId}`),
  update: (id, data) => api.put(`/purchases/recurring-bills/${id}`, data),
  delete: (id) => api.delete(`/purchases/recurring-bills/${id}`),
  processDue: () => api.post('/purchases/recurring-bills/process-due')
};

export const vendorCreditAPI = {
  create: (data) => api.post('/purchases/vendor-credits', data),
  getByCompany: (companyId) => api.get(`/purchases/vendor-credits/${companyId}`),
  getById: (id) => api.get(`/purchases/vendor-credit/${id}`),
  update: (id, data) => api.put(`/purchases/vendor-credits/${id}`, data),
  delete: (id) => api.delete(`/purchases/vendor-credits/${id}`)
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
  getEmployees: (companyId) => api.get(`/payroll/employees/${companyId}`),
  createEmployee: (data) => api.post('/payroll/employees', data),
  updateEmployee: (id, data) => api.put(`/payroll/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/payroll/employees/${id}`),
  saveSalaryStructure: (data) => api.post('/payroll/salary-structure', data),
  saveAttendance: (data) => api.post('/payroll/attendance', data),
  getAttendance: (companyId) => api.get(`/payroll/attendance/${companyId}`),
  process: (data) => api.post('/payroll/process', data),
  getPayslips: (companyId) => api.get(`/payroll/payslips/${companyId}`),
};

// ─── Indian GST Returns ────────────────────────────
export const gstAPI = {
  getGSTR1: (companyId) => api.get(`/tax/gst/gstr1/${companyId}`),
  getGSTR2A: (companyId) => api.get(`/tax/gst/gstr2a/${companyId}`),
  getGSTR3B: (companyId) => api.get(`/tax/gst/gstr3b/${companyId}`),
};

export default api;


