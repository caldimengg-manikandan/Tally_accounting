const express = require('express');
// mergeParams is REQUIRED to access :companyId from the parent router/mount path
const router = express.Router({ mergeParams: true });
const purchasesController = require('./purchases.controller');
const recurringExpenseController = require('./recurringExpense.controller');
const paymentMadeController = require('./paymentMade.controller');
const vendorCreditController = require('./vendorCredit.controller');
const { verifyToken, tenantAccess, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// ─── 1. VENDORS ──────────────────────────────────────────────────────────
router.get('/vendors', purchasesController.getVendors);
router.post('/vendors', purchasesController.createVendor);
router.put('/vendors/:id', purchasesController.updateVendor);
router.delete('/vendors/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), purchasesController.deleteVendor);

// ─── 2. PURCHASE ORDERS ──────────────────────────────────────────────────
router.get('/orders/next-number', purchasesController.getNextOrderNumber);
router.post('/orders/batch-restock', purchasesController.batchRestock);
router.get('/orders', purchasesController.getOrders);
router.get('/orders/:id/pdf-preview', purchasesController.getPurchaseOrderPdfPreview);
router.post('/orders', purchasesController.createOrder);
router.put('/orders/:id', purchasesController.updateOrder);
router.patch('/orders/:id/mark-paid', purchasesController.markOrderAsPaid);
router.delete('/orders/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), purchasesController.deleteOrder);

// ─── 3. VENDOR CREDITS ───────────────────────────────────────────────────
router.get('/vendor-credits', vendorCreditController.getByCompany);
router.get('/vendor-credits/:id', vendorCreditController.getById);
router.post('/vendor-credits', vendorCreditController.create);
router.put('/vendor-credits/:id', vendorCreditController.update);
router.delete('/vendor-credits/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), vendorCreditController.delete);

// ─── 4. BILLS & PAYMENTS ─────────────────────────────────────────────────
router.get('/bills', purchasesController.getBills);
router.post('/bills', purchasesController.createBill);
router.put('/bills/:id', purchasesController.updateBill);

router.get('/payments-made/next-number', paymentMadeController.getNextPaymentNumber);
router.get('/payments-made', paymentMadeController.getPayments);
router.get('/payments-made/:id', paymentMadeController.getPayment);
router.post('/payments-made', paymentMadeController.createPayment);
router.patch('/payments-made/:id/mark-paid', paymentMadeController.markAsPaid);
router.put('/payments-made/:id', paymentMadeController.updatePayment);
router.delete('/payments-made/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), paymentMadeController.deletePayment);
router.get('/unpaid-bills/:vendorId', paymentMadeController.getUnpaidBills);

// ─── 5. EXPENSES ─────────────────────────────────────────────────────────
router.get('/expenses', purchasesController.getExpenses);

// ─── 6. RECURRING EXPENSES & BILLS ───────────────────────────────────────
router.get('/recurring', recurringExpenseController.getByCompany);
router.post('/recurring', recurringExpenseController.create);
router.put('/recurring/:id', recurringExpenseController.update);
router.delete('/recurring/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), recurringExpenseController.delete);
router.post('/recurring/process-due', recurringExpenseController.processDue);



module.exports = router;