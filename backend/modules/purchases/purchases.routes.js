const express = require('express');
const router = express.Router();
const purchasesController = require('./purchases.controller');
const recurringExpenseController = require('./recurringExpense.controller');
const recurringBillController = require('./recurringBill.controller');
const paymentMadeController = require('./paymentMade.controller');
const vendorCreditController = require('./vendorCredit.controller');
const { verifyToken, tenantAccess, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// Vendors
router.get('/vendors/:companyId', purchasesController.getVendors);

// Purchase Orders
router.get('/orders/:companyId', purchasesController.getOrders);
router.post('/orders', purchasesController.createOrder);
router.put('/orders/:id', purchasesController.updateOrder);
router.delete('/orders/:id', purchasesController.deleteOrder);

// Bills
router.get('/bills/:companyId', purchasesController.getBills);
router.post('/bills', purchasesController.createBill);
router.put('/bills/:id', purchasesController.updateBill);

// Payments Made
router.get('/payments-made/next-number/:companyId', paymentMadeController.getNextPaymentNumber);
router.get('/payments-made/payment/:id', paymentMadeController.getPayment);
router.get('/payments-made/:companyId', paymentMadeController.getPayments);
router.post('/payments-made', paymentMadeController.createPayment);
router.put('/payments-made/:id', paymentMadeController.updatePayment);
router.delete('/payments-made/:id', paymentMadeController.deletePayment);
router.get('/unpaid-bills/:vendorId', paymentMadeController.getUnpaidBills);

// Expenses
router.get('/expenses/:companyId', purchasesController.getExpenses);

// Recurring Expenses
router.get('/recurring/:companyId', recurringExpenseController.getByCompany);
router.post('/recurring', recurringExpenseController.create);
router.put('/recurring/:id', recurringExpenseController.update);
router.delete('/recurring/:id', recurringExpenseController.delete);
router.post('/recurring/process-due', recurringExpenseController.processDue);

// Recurring Bills
router.get('/recurring-bills/:companyId', recurringBillController.getByCompany);
router.post('/recurring-bills', recurringBillController.create);
router.put('/recurring-bills/:id', recurringBillController.update);
router.delete('/recurring-bills/:id', recurringBillController.delete);
router.post('/recurring-bills/process-due', recurringBillController.processDue);

// Vendor Credits
router.get('/vendor-credits/:companyId', vendorCreditController.getByCompany);
router.get('/vendor-credit/:id', vendorCreditController.getById);
router.post('/vendor-credits', vendorCreditController.create);
router.put('/vendor-credits/:id', vendorCreditController.update);
router.delete('/vendor-credits/:id', vendorCreditController.delete);

module.exports = router;
