const { PurchaseOrder, Ledger, Group, sequelize, Voucher, Transaction } = require('../../models');
const { Op } = require('sequelize');

exports.getVendors = async (req, res) => {
  try {
    const { companyId } = req.params;
    // Find vendor-related groups (Sundry Creditors, Creditors, Vendors, etc.)
    const creditorGroups = await Group.findAll({
      where: { 
        CompanyId: companyId,
        name: {
          [Op.or]: [
            { [Op.like]: '%Creditors%' },
            { [Op.like]: '%Vendors%' },
            { [Op.like]: '%Suppliers%' }
          ]
        }
      }
    });

    if (!creditorGroups || creditorGroups.length === 0) {
      return res.json([]);
    }

    const groupIds = creditorGroups.map(g => g.id);

    const vendors = await Ledger.findAll({
      where: { 
        CompanyId: companyId,
        GroupId: { [Op.in]: groupIds }
      },
      order: [['name', 'ASC']]
    });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    const orders = await PurchaseOrder.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Ledger, attributes: ['name'] }],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { orderNumber, date, totalAmount, status, notes, supplierLedgerId, companyId, projectId } = req.body;
    const order = await PurchaseOrder.create({
      orderNumber,
      date,
      totalAmount,
      status,
      notes,
      LedgerId: supplierLedgerId,
      CompanyId: companyId,
      ProjectId: projectId
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await PurchaseOrder.destroy({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bills
exports.getBills = async (req, res) => {
    try {
        const { companyId } = req.params;
        const bills = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Purchase'
            },
            include: [{
                model: Transaction,
                include: [{ model: Ledger, attributes: ['id', 'name', 'GroupId'] }]
            }],
            order: [['date', 'DESC']]
        });

        // Map bills to include derived fields for the frontend
        const mappedBills = bills.map(bill => {
            const plainBill = bill.toJSON();
            
            // The Credit transaction is the vendor/supplier
            const crTx = plainBill.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
            // The total amount is the credit to the vendor
            const totalAmount = crTx ? parseFloat(crTx.credit || 0) : 0;

            return {
                ...plainBill,
                totalAmount,
                balanceDue: totalAmount, // TODO: subtract payments made against this bill
                billNumber: plainBill.voucherNumber,
                Ledger: crTx?.Ledger || null,
                LedgerId: crTx?.LedgerId || null,
                status: totalAmount > 0 ? 'OPEN' : 'DRAFT'
            };
        });

        res.json(mappedBills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createBill = async (req, res) => {
    try {
        const { billNumber, reference, date, totalAmount, notes, supplierLedgerId, companyId, items, projectId } = req.body;
        
        if (!supplierLedgerId) {
            return res.status(400).json({ error: 'Supplier Ledger is required' });
        }

        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            return res.status(400).json({ error: 'Bill total must be greater than zero' });
        }

        const total = parseFloat(totalAmount);

        // Build journal entries using debit/credit (no 'type' field on Transaction model)
        // For a Purchase Bill:
        //   DEBIT  → Expense/COGS Ledger (what we bought)
        //   CREDIT → Supplier/Vendor Ledger (what we owe)
        const journalEntries = [];

        // Credit the Supplier (Sundry Creditor) for the full bill amount
        journalEntries.push({ ledgerId: supplierLedgerId, debit: 0, credit: total });

        // Debit each item's account
        if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                if (item.amount > 0 && item.account) {
                    let accountLedger = await Ledger.findOne({
                        where: { name: item.account, CompanyId: companyId }
                    });
                    if (!accountLedger) {
                        accountLedger = await Ledger.findOne({ where: { name: item.account } });
                    }
                    if (accountLedger) {
                        journalEntries.push({ ledgerId: accountLedger.id, debit: parseFloat(item.amount), credit: 0 });
                    }
                }
            }
        }

        // Fallback: if no item accounts found, debit a generic Purchases ledger
        if (journalEntries.length === 1) {
            const { Op } = require('sequelize');
            const purchaseLedger = await Ledger.findOne({
                where: { 
                    CompanyId: companyId,
                    name: { [Op.or]: [{ [Op.like]: '%Purchase%' }, { [Op.like]: '%Cost of Goods%' }] }
                }
            });
            if (purchaseLedger) {
                journalEntries.push({ ledgerId: purchaseLedger.id, debit: total, credit: 0 });
            } else {
                return res.status(400).json({ error: 'No expense/purchase ledger found. Please set up a Purchases or Cost of Goods Sold ledger.' });
            }
        }

        const AccountingService = require('../../services/AccountingService');

        // Use the voucherNumber from frontend if provided, otherwise generate
        const voucherNumber = billNumber || `BILL-${Date.now()}`;

        // Post via AccountingService (with audit, balance update, and double-entry validation)
        const voucher = await AccountingService.recordJournalEntry({
            companyId,
            date: date || new Date(),
            voucherType: 'Purchase',
            narration: JSON.stringify({
                notes,
                items: items || [],
                totalAmount: total,
                reference: reference || ''
            }),
            entries: journalEntries,
            userId: req.user?.id,
            projectId // Added this
        });

        // Override with user-provided bill number
        await voucher.update({ voucherNumber });

        res.status(201).json(voucher);
    } catch (err) {
        console.error('Error creating bill:', err);
        res.status(500).json({ error: err.message });
    }
};

// Placeholder for Expenses (Payment Vouchers - simple version)
exports.getExpenses = async (req, res) => {
    try {
        const { companyId } = req.params;
        const expenses = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Payment'
            },
            include: [{
                model: Transaction,
                include: [{ model: Ledger, attributes: ['id', 'name'] }]
            }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        
        const mappedExpenses = expenses.map(expense => {
            const totalAmount = expense.Transactions?.reduce((sum, t) => {
                return parseFloat(t.debit || 0) > 0 ? sum + parseFloat(t.debit || 0) : sum;
            }, 0) || 0;
            
            const expenseTransaction = expense.Transactions?.find(t => parseFloat(t.debit || 0) > 0);
            
            let customerName = '-';
            let vendorName = '-';
            try {
                if (expense.narration) {
                    const parsed = JSON.parse(expense.narration);
                    if (parsed.vendor) vendorName = parsed.vendor;
                    if (parsed.customer) customerName = parsed.customer;
                }
            } catch (e) {}

            // Find the Credit transaction for 'Paid Through'
            const paymentTransaction = expense.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
            const paidThrough = paymentTransaction?.Ledger?.name || 'Cash';

            return {
                id: expense.id,
                date: expense.date,
                voucherNumber: expense.voucherNumber,
                totalAmount,
                Ledger: expenseTransaction ? expenseTransaction.Ledger : null,
                vendorName,
                customerName,
                paidThrough,
                narration: expense.narration
            };
        });

        res.json(mappedExpenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
