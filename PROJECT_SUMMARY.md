# Project Overview: Cloud Tally Replica 🚀

Welcome to the **Tally Replica** project! This is a modern, cloud-based accounting system designed to help businesses manage their finances securely and easily.

Think of it as a **"Digital Accountant"** that lives in the cloud and makes sure every penny is tracked exactly where it should be.

---

## 🌟 What Does This Software Do?

This application is built for **SaaS (Software as a Service)**. This means one platform can host many different companies at once, while keeping their data completely private and separate.

### 1. 📂 Multi-Company Management
- **Separate Offices:** Every company has its own "digital space."
- **Easy Switching:** If you own three businesses, you can switch between them with one click without logging out.

### 2. 👮 The "Security Guards" (RBAC)
We use a **Role-Based Access Control (RBAC)** system. This is like giving different keys to different people in an office:
- **Admin:** Has the master key. Can see everything and manage users.
- **Accountant:** Can record daily sales, expenses, and invoices.
- **Manager:** Can't necessarily record entries, but can **Approve** them or check the work.
- **Viewer/Auditor:** Only has "Read-Only" keys. They can look at reports but can't accidentally delete anything.

### 3. 📒 Real Accounting (Double-Entry)
The software following the **Double-Entry bookkeeping** rule. If you spend money, it must come from somewhere (Bank/Cash) and go somewhere (Expense). The system ensures your books are always "Balanced."

---

## 🛠️ How It Works (The Simple Version)

### The Backend (The Brain 🧠)
- Built with **Node.js** and **Express**.
- It handles the "Auth" (making sure you are who you say you are) and calculates all the math for your Profit & Loss reports.
- It uses a **Sequelize** database to store your data safely.

### The Frontend (The Face 🖥️)
- Built with **React**.
- It's designed to be fast and look premium.
- Use **AG-Grid** for tables, so you can sort and search through thousands of transactions instantly.

---

## 📊 Key Reports You Get
- **Trial Balance:** A quick check to see if your Debits and Credits match.
- **Profit & Loss:** Tells you if you made money or lost it.
- **Balance Sheet:** A "Snapshot" of what your business owns and owes.
- **Audit Logs:** A history book that shows "Who did what, and when?"

---

## 🏗️ Quick Start for Developers
1. **Install:** Run `npm install` in both `frontend` and `backend` folders.
2. **Setup:** Add your keys to a `.env` file in the backend.
3. **Launch:** Run `npm run dev` in both folders.
4. **Login:** Register a user, create your first company, and start posting vouchers!

---

### Why is this system "Scalable"?
Because it's modular. If you want to add a new role (like "Tax Consultant") or a new feature (like "Payroll"), you can just plug it into the existing system without breaking anything else.
