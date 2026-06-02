// ═══════════════════════════════════════════════════════════════
// MOCK DATA SERVICE — Tally ERP Dashboard
// Swap these with real API calls via /services/api.js
// ═══════════════════════════════════════════════════════════════

export const mockSummaryCards = {
  receivables: {
    total: 2847500,
    current: 1234000,
    overdue: 1613500,
    outstanding: 2847500,
    trend: '+8.2%',
    positive: true,
  },
  payables: {
    total: 1523000,
    current: 890000,
    overdue: 633000,
    outstanding: 1523000,
    trend: '-3.1%',
    positive: false,
  },
  bankBalance: {
    total: 4215890,
    accounts: [
      { name: 'HDFC Current A/c', balance: 2310450, number: '****4521' },
      { name: 'SBI Savings A/c',  balance: 1205440, number: '****8873' },
      { name: 'ICICI OD A/c',     balance: 700000,  number: '****2234' },
    ],
    trend: '+12.4%',
    positive: true,
  },
  gst: {
    payable: 384200,
    receivable: 219800,
    net: 164400,
    filingStatus: 'GSTR-1 Due: 11 Jun',
    itcClaimed: 189500,
    trend: 'On Track',
    positive: true,
  },
};

export const mockCashFlow = [
  { month: 'Jan', inflow: 820000, outflow: 610000 },
  { month: 'Feb', inflow: 940000, outflow: 720000 },
  { month: 'Mar', inflow: 1150000, outflow: 890000 },
  { month: 'Apr', inflow: 1320000, outflow: 980000 },
  { month: 'May', inflow: 1080000, outflow: 760000 },
  { month: 'Jun', inflow: 1420000, outflow: 1050000 },
  { month: 'Jul', inflow: 1560000, outflow: 1120000 },
  { month: 'Aug', inflow: 1290000, outflow: 940000 },
  { month: 'Sep', inflow: 1650000, outflow: 1210000 },
  { month: 'Oct', inflow: 1840000, outflow: 1380000 },
  { month: 'Nov', inflow: 1720000, outflow: 1290000 },
  { month: 'Dec', inflow: 2100000, outflow: 1580000 },
];

export const mockRevenueExpenses = [
  { month: 'Jan', revenue: 820000, expenses: 610000 },
  { month: 'Feb', revenue: 940000, expenses: 720000 },
  { month: 'Mar', revenue: 1150000, expenses: 890000 },
  { month: 'Apr', revenue: 1320000, expenses: 980000 },
  { month: 'May', revenue: 1080000, expenses: 760000 },
  { month: 'Jun', revenue: 1420000, expenses: 1050000 },
];

export const mockReceivablesAging = [
  { bucket: '0-30 Days', amount: 1234000, color: '#22c55e' },
  { bucket: '31-60 Days', amount: 780000, color: '#f59e0b' },
  { bucket: '61-90 Days', amount: 530000, color: '#f97316' },
  { bucket: '90+ Days',   amount: 303500, color: '#ef4444' },
];

export const mockTopCustomers = [
  { name: 'ABC Traders Pvt Ltd',   revenue: 845000,  pct: 89 },
  { name: 'XYZ Enterprises',       revenue: 720000,  pct: 76 },
  { name: 'Sharma Industries',     revenue: 590000,  pct: 62 },
  { name: 'Mehta & Sons',          revenue: 410000,  pct: 43 },
  { name: 'Rajesh Steel Works',    revenue: 285000,  pct: 30 },
];

export const mockTopVendors = [
  { name: 'Global Supplies Ltd',   purchases: 620000, pct: 82 },
  { name: 'Prime Materials Co.',   purchases: 510000, pct: 68 },
  { name: 'Lakshmi Distributors',  purchases: 390000, pct: 52 },
  { name: 'Ravi Imports',          purchases: 250000, pct: 33 },
  { name: 'Tech Components Inc.',  purchases: 180000, pct: 24 },
];

export const mockActivities = [
  {
    id: 1,
    type: 'invoice',
    icon: 'FileText',
    color: 'blue',
    title: 'Invoice Created',
    entity: 'ABC Traders Pvt Ltd',
    amount: 125000,
    desc: 'Tax Invoice #INV-2026-0847',
    time: '2 hours ago',
    ts: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: 2,
    type: 'payment',
    icon: 'CheckCircle',
    color: 'emerald',
    title: 'Payment Received',
    entity: 'XYZ Enterprises',
    amount: 87500,
    desc: 'Against Invoice #INV-2026-0821',
    time: '4 hours ago',
    ts: new Date(Date.now() - 4 * 3600000),
  },
  {
    id: 3,
    type: 'bill',
    icon: 'ShoppingBag',
    color: 'orange',
    title: 'Bill Added',
    entity: 'Global Supplies Ltd',
    amount: 48200,
    desc: 'Purchase Bill #BL-0293',
    time: '6 hours ago',
    ts: new Date(Date.now() - 6 * 3600000),
  },
  {
    id: 4,
    type: 'gst',
    icon: 'Shield',
    color: 'purple',
    title: 'GST Filed',
    entity: 'Tax Authority',
    amount: 38400,
    desc: 'GSTR-1 Filed for May 2026',
    time: 'Yesterday',
    ts: new Date(Date.now() - 26 * 3600000),
  },
  {
    id: 5,
    type: 'voucher',
    icon: 'BookOpen',
    color: 'indigo',
    title: 'Voucher Entry Created',
    entity: 'Internal',
    amount: 15000,
    desc: 'Journal Entry JV-0192 — Depreciation',
    time: 'Yesterday',
    ts: new Date(Date.now() - 30 * 3600000),
  },
  {
    id: 6,
    type: 'invoice',
    icon: 'FileText',
    color: 'blue',
    title: 'Recurring Invoice',
    entity: 'Sharma Industries',
    amount: 64000,
    desc: 'Monthly retainer — Auto-generated',
    time: '2 days ago',
    ts: new Date(Date.now() - 48 * 3600000),
  },
  {
    id: 7,
    type: 'payment',
    icon: 'CheckCircle',
    color: 'emerald',
    title: 'Vendor Payment Made',
    entity: 'Prime Materials Co.',
    amount: 112000,
    desc: 'Against Bill #BL-0281, #BL-0272',
    time: '2 days ago',
    ts: new Date(Date.now() - 52 * 3600000),
  },
];

// ── AI Assistant Mock Responses ──────────────────────────────────
export const mockAIResponses = {
  'create invoice for abc traders worth ₹50,000': {
    type: 'action',
    text: `✅ **Invoice Created Successfully**

**Invoice #INV-2026-0851**
- Customer: ABC Traders Pvt Ltd
- Amount: ₹50,000 + GST (18%) = ₹59,000
- Due Date: 30 Jun 2026
- Status: Draft

Would you like me to send this invoice via email or mark it as sent?`,
    actions: ['Send via Email', 'Mark as Sent', 'View Invoice'],
  },
  'show overdue customers': {
    type: 'list',
    text: `📋 **Overdue Customers (3)**

| Customer | Overdue Amount | Days |
|----------|---------------|------|
| XYZ Enterprises | ₹3,42,000 | 45 days |
| Mehta & Sons | ₹1,84,500 | 62 days |
| Rajesh Steel Works | ₹87,000 | 91 days |

**Total Overdue: ₹6,13,500**

Shall I send payment reminders to all these customers?`,
    actions: ['Send Reminders', 'View Details', 'Export List'],
  },
  'show unpaid vendor bills': {
    type: 'list',
    text: `📋 **Unpaid Vendor Bills (3)**

| Vendor | Bill No. | Due Date | Amount Due |
|--------|----------|----------|------------|
| Global Supplies Ltd | BILL-2026-041 | 15 Jun 2026 | ₹6,20,000 |
| Prime Materials Co. | BILL-2026-092 | 18 Jun 2026 | ₹5,10,000 |
| Lakshmi Distributors | BILL-2026-015 | 22 Jun 2026 | ₹3,90,000 |

**Total Payables: ₹15,20,000**

Shall I process payment vouchers for these bills?`,
    actions: ['Process Payment', 'View Purchase Register', 'Export PDF'],
  },
  'which products are low in stock?': {
    type: 'list',
    text: `⚠️ **Low Stock Alert (3 Items)**

| Item | Current Stock | Reorder Level | Status |
|------|---------------|---------------|--------|
| Steel Plate (Raw) | 12.00 Nos | 50.00 Nos | Low Stock ⚠️ |
| Quick Coat Paint | 5.00 Ltr | 20.00 Ltr | Low Stock ⚠️ |
| Steel Table | 0.00 Nos | 5.00 Nos | Out of Stock ❌ |

Would you like to auto-create a Production Order or draft a Purchase Order for raw materials?`,
    actions: ['Create Production Order', 'Draft Purchase Order', 'View Inventory'],
  },
  'why did profit decrease this month?': {
    type: 'report',
    text: `📉 **Profitability Variance Analysis (May 2026 vs April 2026)**

- **Revenue Decreased by 12%**: Net sales dropped from ₹42.2L to ₹37.1L due to fewer client sign-offs.
- **Administrative Expenses Rose by 8.5%**: Indirect expense hikes in Salaries (+₹45,000) and Electricity (+₹12,000).
- **GST Liability**: Higher ITC blockages under GSTR-2A matching limit cash flow.

**Action Plan:**
1. Focus outstanding invoice collections on XYZ Enterprises (₹3.4L).
2. Defer non-critical vendor payments to preserve cash.

Shall I pull up the comparative monthly P&L statement?`,
    actions: ['Show Detailed P&L', 'View Cash Flow Chart', 'Manage Budgets'],
  },
  'generate gstr summary': {
    type: 'report',
    text: `📊 **GST Returns Summary — May 2026**

- **GSTR-1 (Output GST):** ₹3,84,200 (Sales liabilities)
- **GSTR-2A (Input GST):** ₹2,19,800 (Eligible input tax credit)
- **GSTR-3B (Net Tax Payable):** ₹1,64,400

*Status:* GSTR-1 ready for upload. CGST: ₹82,200 | SGST: ₹82,200 | IGST: ₹0.

Do you want to run the automated tax reconciliation now?`,
    actions: ['File GSTR-1', 'Download GST Excel', 'Reconcile ITC'],
  },
  'show top customers by sales': {
    type: 'list',
    text: `🏆 **Top Customers (Sales Volume)**

| Customer | Total Sales | Share (%) |
|----------|-------------|-----------|
| ABC Traders Pvt Ltd | ₹8,45,000 | 29.8% |
| XYZ Enterprises | ₹7,20,000 | 25.4% |
| Sharma Industries | ₹5,90,000 | 20.8% |
| Mehta & Sons | ₹4,10,000 | 14.5% |

Total Client Contribution: **₹25,65,000** (90.5% of total sales).

Would you like me to generate outstanding statement links for them?`,
    actions: ['Send Statements', 'View Outstanding Receivables', 'Export to Excel'],
  },
  'generate gst report for april 2026': {
    type: 'report',
    text: `📊 **GST Summary — April 2026**

- **Output GST (Collected):** ₹3,84,200
- **Input Tax Credit (ITC):** ₹2,19,800
- **Net GST Payable:** ₹1,64,400
- **GSTR-1 Status:** Filed ✅
- **GSTR-3B Status:** Pending ⚠️

GSTR-3B due date: **20 May 2026** (Overdue)

Do you want me to prepare the GSTR-3B data for filing?`,
    actions: ['Prepare GSTR-3B', 'Download Report', 'View ITC Details'],
  },
  'create recurring invoice every month': {
    type: 'action',
    text: `🔄 **Recurring Invoice Setup**

Please provide the details:
- Customer name?
- Amount?
- Start date?
- Day of month to send?

Or I can clone your last recurring invoice for **Sharma Industries** (₹64,000/month). Shall I proceed?`,
    actions: ['Clone Last Invoice', 'Create New', 'View Templates'],
  },
  'record payment received from xyz ltd': {
    type: 'action',
    text: `💰 **Payment Recorded**

**Receipt #REC-2026-0428**
- From: XYZ Enterprises
- Amount: ₹87,500
- Date: 01 Jun 2026
- Mode: NEFT
- Against: Invoice #INV-2026-0821

Outstanding balance from XYZ: **₹2,54,500**

Shall I send a payment acknowledgement to XYZ Enterprises?`,
    actions: ['Send Acknowledgement', 'View Statement', 'Record Another'],
  },
  'show p&l for this quarter': {
    type: 'report',
    text: `📈 **P&L Report — Q1 FY 2026-27 (Apr–Jun 2026)**

**Revenue**
- Sales: ₹42,20,000
- Other Income: ₹1,80,000
- **Total Revenue: ₹44,00,000**

**Expenses**
- COGS: ₹28,50,000
- Operating Expenses: ₹8,20,000
- Depreciation: ₹1,20,000
- **Total Expenses: ₹37,90,000**

**Net Profit: ₹6,10,000 (13.9% margin)**

Compared to last quarter: ▲ +18.4%`,
    actions: ['Download PDF', 'View Details', 'Compare Quarters'],
  },
  default: {
    type: 'info',
    text: `I'm here to help with your Tally accounting tasks. I can help you:

- 📄 Create invoices, bills, and vouchers
- 💰 Record payments and receipts
- 📊 Generate GST reports and returns
- 📈 Show P&L, balance sheet, trial balance
- 🔄 Set up recurring transactions
- 👥 Manage customers and vendors

What would you like to do today?`,
    actions: ['Create Invoice', 'View Reports', 'GST Filing'],
  },
};

export const AI_SUGGESTION_CHIPS = [
  'Show unpaid vendor bills',
  'Which products are low in stock?',
  'Why did profit decrease this month?',
  'Generate GSTR summary',
  'Show top customers by sales',
  'Show P&L for this quarter',
];

// ── Role Permissions ─────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewReports: true,
    canManageSettings: true,
    canFileGST: true,
  },
  accountant: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canViewReports: true,
    canManageSettings: false,
    canFileGST: true,
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewReports: true,
    canManageSettings: false,
    canFileGST: false,
  },
};
