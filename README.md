# Tally Replica — Cloud Enterprise Accounting System

A scalable, multi-tenant SaaS accounting web application inspired by Tally, built with a modern tech stack. Features robust Role-Based Access Control (RBAC), real-time financial reporting, and comprehensive business workflow management.

## 🚀 Features

### 🏢 Multi-Tenant Architecture
- **Isolated Data:** Each company (tenant) has strictly isolated financial records.
- **Multi-Company Access:** Users can belong to multiple companies and switch between them seamlessly.
- **Active Context:** All API requests are scoped to the user's `activeCompanyId`, ensuring zero cross-tenant data leakage.

### 🔐 Scalable RBAC System
Granular permissions managed via a centralized middleware system with 6 predefined roles:
- **SUPER_ADMIN:** Platform owner with global access across all companies.
- **ADMIN:** Company owner with full control over users and company settings.
- **ACCOUNTANT:** Can create and edit ledger entries, vouchers, and transactions.
- **MANAGER:** Reviewer role with power to approve transactions and oversee workflows.
- **AUDITOR:** Read-only access with exclusive visibility into audit logs.
- **VIEWER:** Basic read-only access for general oversight.

### 💼 Accounting Modules
- **Chart of Accounts:** Manage Groups and Ledgers with auto-resolving hierarchies.
- **Voucher Entry:** Support for various voucher types (Sales, Purchase, Payment, Receipt, etc.).
- **Inventory Management:** Track stock items, units, and real-time inventory levels.
- **Sales & Purchase:** Full "Order-to-Cash" and "Procure-to-Pay" cycles.
- **Reconciliation:** Bank and ledger reconciliation tools.

### 📊 Real-Time Reporting
- **Dashboard:** Visualized KPIs using Recharts (Sales, Expenses, Profit).
- **Financial Statements:** Trial Balance, Profit & Loss, and Balance Sheet generated on the fly.
- **Audit Logs:** Comprehensive tracking of critical actions (Create/Update/Delete).
- **PDF Export:** Export reports and invoices using jsPDF.

---

## 🛠️ Tech Stack

### Backend
- **Core:** Node.js, Express.js
- **ORM:** Sequelize (supporting PostgreSQL, MySQL, and SQLite)
- **Auth:** JWT (JSON Web Tokens), Passport.js (Google OAuth), Bcryptjs
- **Database:** SQLite (local dev), PostgreSQL (production)

### Frontend
- **Framework:** React (Vite)
- **State Management:** Redux Toolkit & Zustand
- **UI/Components:** Tailwind CSS, Lucide Icons, Framer Motion (animations)
- **Data Tables:** AG-Grid (Enterprise-grade tables)
- **Charts:** Recharts

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/caldimengg-manikandan/Tally_accounting.git
cd tally_host
```

### 2. Backend Configuration
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
JWT_SECRET=your_secret_key
DB_DIALECT=sqlite
CLIENT_URL=http://localhost:5173
# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

### 3. Frontend Configuration
```bash
cd ../frontend
npm install
```

### 4. Run the Application
**Start Backend:**
```bash
cd backend
npm run dev
```
**Start Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🛡️ Security Implementation
- **JWT Embedding:** Tokens include `user_id`, `role`, and `active_company_id`.
- **Three-Layer Middleware:**
  1. `verifyToken`: Validates authenticity.
  2. `tenantAccess`: Enforces company scoping.
  3. `authorizeRoles`: Restricts based on role permissions.
- **Soft Deletes:** Critical financial records use `paranoid` deletion to prevent accidental data loss.
- **Bcrypt Hashing:** Passwords never stored in plain text.

---

## 📄 License
This project is licensed under the ISC License.