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

// Helper function to process GST, TDS, discounts, and adjustments for Purchase Bills
const processBillTaxesAndAdjustments = async (companyId, { taxAmount, tdsAmount, discountAmount, adjustment }, journalEntries) => {
    const { Op } = require('sequelize');
    
    // 1. GST Input (Debit)
    if (taxAmount && parseFloat(taxAmount) > 0) {
        let gstLedger = await Ledger.findOne({
            where: { CompanyId: companyId, name: { [Op.or]: [{ [Op.like]: '%GST%Input%' }, { [Op.like]: 'Input%GST%' }] } }
        });
        if (!gstLedger) {
            const taxGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } } });
            gstLedger = await Ledger.create({
                name: 'Input GST', code: 'TAX-001', category: 'Asset', groupName: 'Duties & Taxes',
                GroupId: taxGroup ? taxGroup.id : null, CompanyId: companyId, currentBalance: 0
            });
        }
        journalEntries.push({ ledgerId: gstLedger.id, debit: parseFloat(taxAmount), credit: 0 });
    }

    // 2. TDS Payable (Credit)
    if (tdsAmount && parseFloat(tdsAmount) > 0) {
        let tdsLedger = await Ledger.findOne({
            where: { CompanyId: companyId, name: { [Op.like]: '%TDS%Payable%' } }
        });
        if (!tdsLedger) {
            const taxGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } } });
            tdsLedger = await Ledger.create({
                name: 'TDS Payable', code: 'TAX-002', category: 'Liability', groupName: 'Duties & Taxes',
                GroupId: taxGroup ? taxGroup.id : null, CompanyId: companyId, currentBalance: 0
            });
        }
        journalEntries.push({ ledgerId: tdsLedger.id, debit: 0, credit: parseFloat(tdsAmount) });
    }

    // 3. Discount Received (Credit)
    if (discountAmount && parseFloat(discountAmount) > 0) {
        let discountLedger = await Ledger.findOne({
            where: { CompanyId: companyId, name: { [Op.like]: '%Discount%Received%' } }
        });
        if (!discountLedger) {
            const incGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Indirect%Income%' } } });
            discountLedger = await Ledger.create({
                name: 'Discount Received', code: 'INC-001', category: 'Income', groupName: 'Indirect Incomes',
                GroupId: incGroup ? incGroup.id : null, CompanyId: companyId, currentBalance: 0
            });
        }
        journalEntries.push({ ledgerId: discountLedger.id, debit: 0, credit: parseFloat(discountAmount) });
    }

    // 4. Rounding Adjustment (Debit/Credit)
    if (adjustment && parseFloat(adjustment) !== 0) {
        const adjVal = parseFloat(adjustment);
        let adjLedger = await Ledger.findOne({
            where: { CompanyId: companyId, name: { [Op.like]: '%Rounding%' } }
        });
        if (!adjLedger) {
            const expGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Indirect%Expense%' } } });
            adjLedger = await Ledger.create({
                name: 'Rounding Adjustment', code: 'EXP-001', category: 'Expense', groupName: 'Indirect Expenses',
                GroupId: expGroup ? expGroup.id : null, CompanyId: companyId, currentBalance: 0
            });
        }
        if (adjVal > 0) {
            journalEntries.push({ ledgerId: adjLedger.id, debit: adjVal, credit: 0 }); // Increases payable -> Expense (Debit)
        } else {
            journalEntries.push({ ledgerId: adjLedger.id, debit: 0, credit: Math.abs(adjVal) }); // Decreases payable -> Income (Credit)
        }
    }
};

exports.createBill = async (req, res) => {
    try {
        const { billNumber, reference, date, totalAmount, notes, supplierLedgerId, companyId, items, projectId, taxAmount, tdsAmount, discountAmount, adjustment, taxRate, tdsRate, tdsName, discount, dueDate, paymentTerms } = req.body;
        
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

        let itemDebitsAdded = false;
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
                        itemDebitsAdded = true;
                    }
                }
            }
        }

        // Process Taxes, Discounts, and Adjustments
        await processBillTaxesAndAdjustments(companyId, { taxAmount, tdsAmount, discountAmount, adjustment }, journalEntries);

        // Fallback: if no item accounts found, debit a generic Purchases ledger
        if (!itemDebitsAdded) {
            const { Op } = require('sequelize');
            let purchaseLedger = await Ledger.findOne({
                where: { 
                    CompanyId: companyId,
                    name: { [Op.or]: [{ [Op.like]: '%Purchase%' }, { [Op.like]: '%Cost of Goods%' }] }
                }
            });
            
            if (!purchaseLedger) {
                // Auto-create Purchases ledger to prevent save failure
                const purchaseGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Purchase%' } } });
                purchaseLedger = await Ledger.create({
                    name: 'Purchases',
                    code: 'PUR-001',
                    category: 'Expense',
                    groupName: 'Purchase Accounts',
                    GroupId: purchaseGroup ? purchaseGroup.id : null,
                    CompanyId: companyId,
                    currentBalance: 0
                });
            }
            
            journalEntries.push({ ledgerId: purchaseLedger.id, debit: total, credit: 0 });
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
                reference: reference || '',
                taxRate: taxRate || 0,
                tdsRate: tdsRate || 0,
                tdsName: tdsName || '',
                discount: discount || 0,
                adjustment: adjustment || 0,
                dueDate: dueDate || '',
                paymentTerms: paymentTerms || 'Due on Receipt'
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

exports.updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { billNumber, reference, date, totalAmount, notes, supplierLedgerId, companyId, items, projectId, taxAmount, tdsAmount, discountAmount, adjustment, taxRate, tdsRate, tdsName, discount, dueDate, paymentTerms } = req.body;
        
        if (!supplierLedgerId) {
            return res.status(400).json({ error: 'Supplier Ledger is required' });
        }

        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            return res.status(400).json({ error: 'Bill total must be greater than zero' });
        }

        const total = parseFloat(totalAmount);

        const journalEntries = [];

        // Credit the Supplier (Sundry Creditor) for the full bill amount
        journalEntries.push({ ledgerId: supplierLedgerId, debit: 0, credit: total });

        let itemDebitsAdded = false;
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
                        itemDebitsAdded = true;
                    }
                }
            }
        }

        // Process Taxes, Discounts, and Adjustments
        await processBillTaxesAndAdjustments(companyId, { taxAmount, tdsAmount, discountAmount, adjustment }, journalEntries);

        // Fallback: if no item accounts found, debit a generic Purchases ledger
        if (!itemDebitsAdded) {
            const { Op } = require('sequelize');
            let purchaseLedger = await Ledger.findOne({
                where: { 
                    CompanyId: companyId,
                    name: { [Op.or]: [{ [Op.like]: '%Purchase%' }, { [Op.like]: '%Cost of Goods%' }] }
                }
            });
            
            if (!purchaseLedger) {
                // Auto-create Purchases ledger to prevent save failure
                const purchaseGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Purchase%' } } });
                purchaseLedger = await Ledger.create({
                    name: 'Purchases',
                    code: 'PUR-001',
                    category: 'Expense',
                    groupName: 'Purchase Accounts',
                    GroupId: purchaseGroup ? purchaseGroup.id : null,
                    CompanyId: companyId,
                    currentBalance: 0
                });
            }
            
            journalEntries.push({ ledgerId: purchaseLedger.id, debit: total, credit: 0 });
        }

        const AccountingService = require('../../services/AccountingService');
        const voucherNumber = billNumber || `BILL-${Date.now()}`;

        const voucher = await AccountingService.updateJournalEntry(id, {
            companyId,
            date: date || new Date(),
            narration: JSON.stringify({
                notes,
                items: items || [],
                totalAmount: total,
                reference: reference || '',
                taxRate: taxRate || 0,
                tdsRate: tdsRate || 0,
                tdsName: tdsName || '',
                discount: discount || 0,
                adjustment: adjustment || 0,
                dueDate: dueDate || '',
                paymentTerms: paymentTerms || 'Due on Receipt'
            }),
            entries: journalEntries,
            userId: req.user?.id,
            voucherNumber,
            projectId
        });

        res.json(voucher);
    } catch (err) {
        console.error('Error updating bill:', err);
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
            let reference = '';
            try {
                if (expense.narration) {
                    const parsed = JSON.parse(expense.narration);
                    if (parsed.vendor) vendorName = parsed.vendor;
                    if (parsed.customer) customerName = parsed.customer;
                    if (parsed.invoiceNumber) reference = parsed.invoiceNumber;
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
                reference,
                narration: expense.narration
            };
        });

        res.json(mappedExpenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
