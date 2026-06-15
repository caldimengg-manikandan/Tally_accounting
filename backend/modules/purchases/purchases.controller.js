const { PurchaseOrder, Ledger, Group, sequelize, Voucher, Transaction, VendorCredit, Item, Company } = require('../../models');
const { Op } = require('sequelize');

exports.createVendor = async (req, res) => res.status(501).json({ error: 'Not implemented. Use ledgerAPI.' });
exports.updateVendor = async (req, res) => res.status(501).json({ error: 'Not implemented. Use ledgerAPI.' });
exports.deleteVendor = async (req, res) => res.status(501).json({ error: 'Not implemented. Use ledgerAPI.' });
exports.markOrderAsPaid = async (req, res) => res.status(501).json({ error: 'Not implemented.' });

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

    // Dynamically calculate Unused Credits for each vendor in parallel
    const vendorsWithCredits = await Promise.all(vendors.map(async (vendor) => {
      // 1. Sum of remaining/unapplied Vendor Credit notes where status is 'Open'
      const openCredits = await VendorCredit.findAll({
        where: {
          vendorLedgerId: vendor.id,
          CompanyId: companyId,
          status: 'Open'
        }
      });

      const totalCredits = openCredits.reduce((sum, c) => {
        // Safe check for balance/remainingAmount/totalAmount field
        const amt = c.remainingAmount !== undefined ? c.remainingAmount : (c.balance !== undefined ? c.balance : c.totalAmount);
        return sum + parseFloat(amt || 0);
      }, 0);

      // 2. Sum of unallocated/advance payments
      // Sum the debit amounts from ledger transaction lines belonging to Payment vouchers with status = 'Paid'
      // where there is NO associated Bill Foreign Key (no BILL_REF: in description)
      const advanceTransactions = await Transaction.findAll({
        where: {
          LedgerId: vendor.id,
          debit: { [Op.gt]: 0 }
        },
        include: [{
          model: Voucher,
          where: {
            CompanyId: companyId,
            voucherType: 'Payment',
            status: 'Paid'
          }
        }]
      });

      const totalAdvances = advanceTransactions
        .filter(t => !t.description || !t.description.includes('BILL_REF:'))
        .reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);

      // Total Unused Credits = Total Open/Partially Used Credits + Total Advance/Unallocated Payments
      const unusedCredits = totalCredits + totalAdvances;

      return {
        ...vendor.toJSON(),
        unusedCredits: parseFloat(unusedCredits.toFixed(2))
      };
    }));

    res.json(vendorsWithCredits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    const orders = await PurchaseOrder.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Ledger }],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNextOrderNumber = async (req, res) => {
    try {
        const { companyId } = req.params;

        const orders = await PurchaseOrder.findAll({
            where: { CompanyId: companyId },
            attributes: ['orderNumber']
        });

        let maxNum = 0;
        orders.forEach(o => {
            if (!o.orderNumber) return;
            const match = o.orderNumber.match(/(\d+)(?!.*\d)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });

        const nextNum = maxNum + 1;
        const formattedNextNum = `PO-${String(nextNum).padStart(5, '0')}`;
        
        res.json({ nextNumber: formattedNextNum });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ── PDF Preview ───────────────────────────────────────────────────────────
exports.getPurchaseOrderPdfPreview = async (req, res) => {
    const path = require('path');
    const fs   = require('fs');

    try {
        const { id } = req.params;

        // Fetch the PO with its vendor (Ledger) and Company
        const order = await PurchaseOrder.findOne({
            where: { id, CompanyId: req.companyId },
            include: [
                { model: Ledger },
                { model: Company }
            ]
        });
        if (!order) return res.status(404).json({ error: 'Record not found or access denied' });

        // Temp directory for caching PDFs (one per PO)
        const tempDir = path.join(__dirname, '../../uploads/temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const filePath = path.join(tempDir, `po_${id}.pdf`);

        // Re-generate if file doesn't already exist for this PO
        if (!fs.existsSync(filePath)) {
            const PDFService = require('../../services/PDFService');
            const vendor  = order.Ledger  || {};
            const company = order.Company || {};
            let items = [];
            try { items = JSON.parse(order.itemsJson || '[]'); } catch (e) { items = []; }

            const pdfBuffer = await PDFService.generatePurchaseOrder(order, items, company, vendor);
            fs.writeFileSync(filePath, pdfBuffer);
        }

        // Stream the file back to the browser as a preview
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="PO_${order.orderNumber || id}.pdf"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (err) {
        console.error('PDF Preview Error:', err);
        res.status(500).json({ error: err.message });
    }
};


exports.createOrder = async (req, res) => {
  try {
    const { 
      orderNumber, date, totalAmount, status, notes, supplierLedgerId, companyId, projectId,
      reference, deliveryDate, paymentTerms, shipmentPreference, deliveryAddress, deliveryAddressText,
      deliveryAddressDataJson, itemsJson, discount, adjustment, taxRate, subtotal, discountAmount,
      taxAmount, terms, tdsAmount, tdsRate, tdsName, emailContactsJson
    } = req.body;
    const order = await PurchaseOrder.create({
      orderNumber,
      date,
      totalAmount,
      status: (status || 'draft').toLowerCase(),
      billed_status: req.body.billed_status || 'yet_to_be_billed',
      notes,
      LedgerId: supplierLedgerId,
      CompanyId: companyId,
      ProjectId: projectId,
      reference,
      deliveryDate,
      paymentTerms,
      shipmentPreference,
      deliveryAddress,
      deliveryAddressText,
      deliveryAddressDataJson,
      itemsJson,
      discount,
      adjustment,
      taxRate,
      subtotal,
      discountAmount,
      taxAmount,
      terms,
      tdsAmount,
      tdsRate,
      tdsName,
      emailContactsJson
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findOne({
      where: { id, CompanyId: req.companyId }
    });
    if (!order) return res.status(404).json({ error: 'Record not found or access denied' });
    
    const updateData = { ...req.body };
    if (updateData.supplierLedgerId) {
      updateData.LedgerId = updateData.supplierLedgerId;
    }
    
    await order.update(updateData);

    // Delete cached preview PDF if it exists so that it is forced to regenerate
    const path = require('path');
    const fs   = require('fs');
    const filePath = path.join(__dirname, '../../uploads/temp', `po_${id}.pdf`);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PurchaseOrder.destroy({ where: { id, CompanyId: req.companyId } });
    if (!deleted) return res.status(404).json({ error: 'Record not found or access denied' });
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
        const mappedBills = await Promise.all(bills.map(async (bill) => {
            const plainBill = bill.toJSON();
            
            // The Credit transaction is the vendor/supplier
            const crTx = plainBill.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
            // The total amount is the credit to the vendor
            const totalAmount = crTx ? parseFloat(crTx.credit || 0) : 0;

            // Calculate payments made against this bill via BILL_REF transactions
            const payments = await Transaction.findAll({
                where: {
                    description: { [Op.like]: `%BILL_REF:${bill.id}%` }
                },
                include: [{
                    model: Voucher,
                    where: { status: 'Paid' }
                }]
            });
            const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);
            const balanceDue = Math.max(0, totalAmount - amountPaid);

            // Derive status from balance
            let status = bill.status; // Use persisted status if available
            if (!status || status === 'OPEN') {
                if (totalAmount <= 0) status = 'DRAFT';
                else if (balanceDue <= 0.01) status = 'PAID';
                else if (amountPaid > 0) status = 'PARTIALLY_PAID';
                else status = 'OPEN';
            }

            return {
                ...plainBill,
                totalAmount,
                balanceDue,
                amountPaid,
                billNumber: plainBill.voucherNumber,
                Ledger: crTx?.Ledger || null,
                LedgerId: crTx?.LedgerId || null,
                status
            };
        }));

        res.json(mappedBills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Helper function to process GST, TDS, discounts, and adjustments for Purchase Bills
const processBillTaxesAndAdjustments = async (companyId, { supplierLedgerId, taxAmount, tdsAmount, discountAmount, adjustment }, journalEntries) => {
    const { Op } = require('sequelize');
    
    // 1. GST Input (Debit)
    if (taxAmount && parseFloat(taxAmount) > 0) {
        // Fetch company and vendor details to determine states
        const company = await Company.findByPk(companyId);
        const vendor = supplierLedgerId ? await Ledger.findByPk(supplierLedgerId) : null;

        const vendorGstin = vendor?.gstNumber;
        const companyGstin = company?.gstNumber;

        const getGstinStateCode = (gstin) => (gstin && gstin.length >= 2 ? gstin.substring(0, 2) : null);
        const vendorStateCode = getGstinStateCode(vendorGstin);
        const companyStateCode = getGstinStateCode(companyGstin);

        let isSameState = false;
        let isUnregistered = !vendorGstin;

        if (vendorStateCode && companyStateCode) {
            isSameState = vendorStateCode === companyStateCode;
        } else {
            // Fallback comparison by state name
            const vendorState = vendor?.state || '';
            const companyState = company?.state || '';
            if (vendorState && companyState) {
                isSameState = vendorState.toLowerCase().trim() === companyState.toLowerCase().trim();
            } else {
                isSameState = true; // default fallback
            }
        }

        const taxGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } } });

        if (isUnregistered) {
            // Unregistered Vendor: Apply standard GST, no split
            let gstLedger = await Ledger.findOne({
                where: { CompanyId: companyId, name: 'Input GST' }
            });
            if (!gstLedger) {
                gstLedger = await Ledger.create({
                    name: 'Input GST', code: 'TAX-001', category: 'Asset', groupName: 'Duties & Taxes',
                    GroupId: taxGroup ? taxGroup.id : null, CompanyId: companyId, currentBalance: 0
                });
            }
            journalEntries.push({ ledgerId: gstLedger.id, debit: parseFloat(taxAmount), credit: 0 });
        } else if (isSameState) {
            // Same State: Split into CGST and SGST
            const halfTax = parseFloat((parseFloat(taxAmount) / 2).toFixed(2));
            const otherHalfTax = parseFloat((parseFloat(taxAmount) - halfTax).toFixed(2));

            let cgstLedger = await Ledger.findOne({
                where: { CompanyId: companyId, name: { [Op.or]: ['Input CGST', 'CGST Input'] } }
            });
            if (!cgstLedger) {
                cgstLedger = await Ledger.create({
                    name: 'Input CGST', code: 'TAX-CGST', category: 'Asset', groupName: 'Duties & Taxes',
                    GroupId: taxGroup ? taxGroup.id : null, CompanyId: companyId, currentBalance: 0
                });
            }

            let sgstLedger = await Ledger.findOne({
                where: { CompanyId: companyId, name: { [Op.or]: ['Input SGST', 'SGST Input'] } }
            });
            if (!sgstLedger) {
                sgstLedger = await Ledger.create({
                    name: 'Input SGST', code: 'TAX-SGST', category: 'Asset', groupName: 'Duties & Taxes',
                    GroupId: taxGroup ? taxGroup.id : null, CompanyId: companyId, currentBalance: 0
                });
            }

            journalEntries.push({ ledgerId: cgstLedger.id, debit: halfTax, credit: 0 });
            journalEntries.push({ ledgerId: sgstLedger.id, debit: otherHalfTax, credit: 0 });
        } else {
            // Different State: Apply IGST
            let igstLedger = await Ledger.findOne({
                where: { CompanyId: companyId, name: { [Op.or]: ['Input IGST', 'IGST Input'] } }
            });
            if (!igstLedger) {
                igstLedger = await Ledger.create({
                    name: 'Input IGST', code: 'TAX-IGST', category: 'Asset', groupName: 'Duties & Taxes',
                    GroupId: taxGroup ? taxGroup.id : null, CompanyId: companyId, currentBalance: 0
                });
            }
            journalEntries.push({ ledgerId: igstLedger.id, debit: parseFloat(taxAmount), credit: 0 });
        }
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
        const { billNumber, reference, date, totalAmount, notes, supplierLedgerId, companyId, items, projectId, taxAmount, tdsAmount, discountAmount, adjustment, taxRate, tdsRate, tdsName, discount, dueDate, paymentTerms, status } = req.body;
        
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
                    if (accountLedger) {
                        journalEntries.push({ ledgerId: accountLedger.id, debit: parseFloat(item.amount), credit: 0 });
                        itemDebitsAdded = true;
                    }
                }
            }
        }

        // Process Taxes, Discounts, and Adjustments
        await processBillTaxesAndAdjustments(companyId, { supplierLedgerId, taxAmount, tdsAmount, discountAmount, adjustment }, journalEntries);

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
            
            let subtotal = 0;
            if (items && Array.isArray(items) && items.length > 0) {
                subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            } else {
                subtotal = total - (parseFloat(taxAmount) || 0) + (parseFloat(discountAmount) || 0) - (parseFloat(adjustment) || 0);
            }
            journalEntries.push({ ledgerId: purchaseLedger.id, debit: subtotal, credit: 0 });
        }

        const AccountingService = require('../../services/AccountingService');

        // Use the voucherNumber from frontend if provided, otherwise generate
        const voucherNumber = billNumber || `BILL-${Date.now()}`;

        // Post via AccountingService (with audit, balance update, and double-entry validation)
        const voucher = await AccountingService.recordJournalEntry({
            companyId,
            date: date || new Date(),
            voucherType: 'Purchase',
            reference: reference || '',
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

        // Override with user-provided bill number and status
        await voucher.update({ voucherNumber, status: (status || 'OPEN').toUpperCase() });

        // Link with Purchase Order and mark as billed
        try {
            const { PurchaseOrder } = require('../../models');
            let poToUpdate = null;
            const poId = req.body.purchase_order_id || req.body.poId;
            if (poId) {
                poToUpdate = await PurchaseOrder.findByPk(poId);
            } else if (reference) {
                poToUpdate = await PurchaseOrder.findOne({
                    where: {
                        orderNumber: reference,
                        CompanyId: companyId
                    }
                });
            }
            if (poToUpdate && voucher.status === 'OPEN') {
                await poToUpdate.update({ 
                    status: 'closed',
                    billed_status: 'billed' 
                });
                console.log(`PO ID ${poToUpdate.id} successfully updated to CLOSED & BILLED.`);
            }
        } catch (poErr) {
            console.error('Failed to update parent purchase order status:', poErr);
        }

        // Update inventory stock quantities
        if (items && Array.isArray(items) && items.length > 0) {
            for (const itemData of items) {
                if (itemData.itemId && parseFloat(itemData.quantity) > 0) {
                    const dbItem = await Item.findByPk(itemData.itemId);
                    if (dbItem) {
                        dbItem.currentStock = parseFloat(dbItem.currentStock || 0) + parseFloat(itemData.quantity);
                        await dbItem.save();
                    }
                }
            }
        }

        res.status(201).json(voucher);
    } catch (err) {
        console.error('Error creating bill:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { billNumber, reference, date, totalAmount, notes, supplierLedgerId, companyId, items, projectId, taxAmount, tdsAmount, discountAmount, adjustment, taxRate, tdsRate, tdsName, discount, dueDate, paymentTerms, status } = req.body;
        
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
                    if (accountLedger) {
                        journalEntries.push({ ledgerId: accountLedger.id, debit: parseFloat(item.amount), credit: 0 });
                        itemDebitsAdded = true;
                    }
                }
            }
        }

        // Process Taxes, Discounts, and Adjustments
        await processBillTaxesAndAdjustments(companyId, { supplierLedgerId, taxAmount, tdsAmount, discountAmount, adjustment }, journalEntries);

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
            
            let subtotal = 0;
            if (items && Array.isArray(items) && items.length > 0) {
                subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            } else {
                subtotal = total - (parseFloat(taxAmount) || 0) + (parseFloat(discountAmount) || 0) - (parseFloat(adjustment) || 0);
            }
            journalEntries.push({ ledgerId: purchaseLedger.id, debit: subtotal, credit: 0 });
        }

        const AccountingService = require('../../services/AccountingService');
        const voucherNumber = billNumber || `BILL-${Date.now()}`;

        // 1. Reverse old stock quantities from current stock
        const oldVoucher = await Voucher.findOne({
            where: { id, CompanyId: req.companyId }
        });
        if (!oldVoucher) return res.status(404).json({ error: 'Record not found or access denied' });
        
        if (oldVoucher && oldVoucher.narration) {
            try {
                const parsed = JSON.parse(oldVoucher.narration);
                if (parsed && Array.isArray(parsed.items)) {
                    for (const oldItem of parsed.items) {
                        if (oldItem.itemId && parseFloat(oldItem.quantity) > 0) {
                            const dbItem = await Item.findByPk(oldItem.itemId);
                            if (dbItem) {
                                dbItem.currentStock = parseFloat(dbItem.currentStock || 0) - parseFloat(oldItem.quantity);
                                await dbItem.save();
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to parse old narration for stock reversal:', err);
            }
        }

        // 2. Update journal entry
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

        // 3. Update status in database
        await voucher.update({ status: (status || 'OPEN').toUpperCase() });

        // 3. Increment stock with new quantities
        if (items && Array.isArray(items) && items.length > 0) {
            for (const itemData of items) {
                if (itemData.itemId && parseFloat(itemData.quantity) > 0) {
                    const dbItem = await Item.findByPk(itemData.itemId);
                    if (dbItem) {
                        dbItem.currentStock = parseFloat(dbItem.currentStock || 0) + parseFloat(itemData.quantity);
                        await dbItem.save();
                    }
                }
            }
        }

        // Link with Purchase Order and mark as billed
        try {
            const { PurchaseOrder } = require('../../models');
            let poToUpdate = null;
            const poId = req.body.purchase_order_id || req.body.poId;
            if (poId) {
                poToUpdate = await PurchaseOrder.findByPk(poId);
            } else if (reference) {
                poToUpdate = await PurchaseOrder.findOne({
                    where: {
                        orderNumber: reference,
                        CompanyId: companyId
                    }
                });
            }
            if (poToUpdate && voucher.status === 'OPEN') {
                await poToUpdate.update({ 
                    status: 'closed',
                    billed_status: 'billed' 
                });
                console.log(`PO ID ${poToUpdate.id} successfully updated to CLOSED & BILLED.`);
            }
        } catch (poErr) {
            console.error('Failed to update parent purchase order status:', poErr);
        }

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
