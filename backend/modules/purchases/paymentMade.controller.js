const { Voucher, Transaction, Ledger, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');

/**
 * Helper to update linked bill statuses after a payment status change.
 */
async function updateBillsForPayment(paymentVoucherId, transaction = null) {
    const voucher = await Voucher.findByPk(paymentVoucherId, {
        include: [{ model: Transaction }],
        transaction
    });
    if (!voucher || !voucher.Transactions) return;

    for (const tx of voucher.Transactions) {
        const match = (tx.description || '').match(/BILL_REF:([\w-]+)/);
        if (!match) continue;
        const billId = match[1];

        // Find the bill voucher
        const bill = await Voucher.findByPk(billId, {
            include: [{ model: Transaction }],
            transaction
        });
        if (!bill || bill.voucherType !== 'Purchase') continue;

        // Get the vendor credit transaction (= bill total)
        const vendorTx = bill.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
        const billTotal = parseFloat(vendorTx?.credit || 0);

        // Sum ALL payments against this bill that are 'Paid'
        const allPayments = await Transaction.findAll({
            where: { CompanyId: bill.CompanyId, description: { [Op.like]: `%BILL_REF:${billId}%` } },
            include: [{
                model: Voucher,
                where: { status: 'Paid', CompanyId: bill.CompanyId }
            }],
            transaction
        });
        const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);

        // Determine bill status
        let billStatus;
        if (totalPaid >= billTotal - 0.01) {
            billStatus = 'PAID';
        } else if (totalPaid > 0) {
            billStatus = 'PARTIALLY_PAID';
        } else {
            billStatus = 'OPEN';
        }

        await bill.update({ status: billStatus }, { transaction });
    }
}
exports.getNextPaymentNumber = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Fetch all Payment voucherNumbers for this company
        const payments = await Voucher.findAll({
            where: { CompanyId: companyId, voucherType: 'Payment' },
            attributes: ['voucherNumber']
        });

        let maxNum = 0;
        payments.forEach(p => {
            if (!p.voucherNumber) return;
            // Extract the last sequential numeric part of the voucherNumber (e.g. from "PAY-2026-0004" -> "0004" -> 4; from "PAY-9" -> "9" -> 9; from "1" -> "1" -> 1)
            const match = p.voucherNumber.match(/(\d+)(?!.*\d)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });

        res.json({ nextNumber: maxNum + 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getUnpaidBills = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { companyId, excludePaymentId } = req.query;

        if (!companyId) return res.status(400).json({ error: "companyId is required" });

        // 1. Get all 'Purchase' vouchers (Bills) for this vendor
        // Find Purchase vouchers that have a Credit entry for this vendor ledger (credit > 0 means vendor is owed)
        const bills = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Purchase'
            },
            include: [{
                model: Transaction,
                required: true
            }],
            order: [['date', 'ASC']]
        });

        // Filter: only bills that have a credit transaction for this vendor
        const vendorBills = bills.filter(bill =>
            bill.Transactions.some(t => t.LedgerId == vendorId && parseFloat(t.credit || 0) > 0)
        );

        // 2. For each bill, calculate the amount paid so far
        const billsWithBalance = await Promise.all(vendorBills.map(async (bill) => {
            // The credit transaction to the vendor = bill amount
            const vendorTx = bill.Transactions.find(t => t.LedgerId == vendorId && parseFloat(t.credit || 0) > 0);
            const billAmount = parseFloat(vendorTx?.credit || 0);

            const paymentWhere = {
                CompanyId: companyId,
                LedgerId: vendorId,
                description: { [Op.like]: `%BILL_REF:${bill.id}%` }
            };
            if (excludePaymentId) {
                paymentWhere.VoucherId = { [Op.ne]: excludePaymentId };
            }

            const payments = await Transaction.findAll({
                where: paymentWhere,
                include: [{
                    model: Voucher,
                    where: { status: 'Paid', CompanyId: companyId }
                }]
            });

            const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);
            const balance = billAmount - amountPaid;

            // Parse dueDate and notes from narration JSON if present
            let dueDate = null;
            let notes = '';
            try {
                const narrationData = typeof bill.narration === 'string' ? JSON.parse(bill.narration) : bill.narration;
                dueDate = narrationData?.dueDate || null;
                notes = narrationData?.notes || '';
            } catch (e) {}

            return {
                id: bill.id,
                billNumber: bill.voucherNumber,
                date: bill.date,
                dueDate,
                totalAmount: billAmount,
                amountPaid,
                balanceDue: balance,
                balance,
                reference: bill.reference || notes
            };
        }));

        res.json(billsWithBalance.filter(b => b.balance > 0.01));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.createPayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { 
            vendorId, 
            paymentNumber, 
            paymentDate, 
            paymentMode, 
            paidThroughId, 
            reference, 
            amount, 
            billAllocations, // Array of { billId, amount }
            companyId,
            status, // 'Draft' or 'Paid'
            tds,
            depositToId,
            activeTab
        } = req.body;

        if (!vendorId || !paidThroughId || !amount) {
            return res.status(400).json({ error: "Vendor, Paid Through, and Payment Made amount are required fields." });
        }

        // 1. Build journal entries
        const entries = [
            { ledgerId: paidThroughId, debit: 0, credit: amount }
        ];

        if (billAllocations && billAllocations.length > 0) {
            let totalAllocated = 0;
            for (const alloc of billAllocations) {
                if (alloc.amount > 0) {
                    entries.push({
                        ledgerId: vendorId,
                        debit: alloc.amount,
                        credit: 0,
                        description: `Payment for Bill ${alloc.billNumber || ''}. BILL_REF:${alloc.billId}`
                    });
                    totalAllocated += parseFloat(alloc.amount);
                }
            }
            const excess = amount - totalAllocated;
            if (excess > 0.01) {
                entries.push({
                    ledgerId: vendorId,
                    debit: excess,
                    credit: 0,
                    description: `Excess payment / Advance`
                });
            }
        } else {
            entries.push({
                ledgerId: vendorId,
                debit: amount,
                credit: 0,
                description: `Lump sum payment`
            });
        }

        let narrationText = `Payment Made via ${paymentMode}. Ref: ${reference}`;
        if (activeTab === 'Vendor Advance' || tds || depositToId) {
            const meta = { tds, depositToId, activeTab };
            narrationText += ` ||metadata:${JSON.stringify(meta)}`;
        }

        // 2. Post accounting entries via AccountingService
        const voucher = await AccountingService.recordJournalEntry({
            companyId,
            date: paymentDate || new Date(),
            voucherType: 'Payment',
            voucherNumber: paymentNumber,
            reference: reference || '',
            narration: narrationText,
            entries,
            userId: req.user?.id
        }, t);

        // 3. Persist the payment status (Draft or Paid)
        const paymentStatus = (status === 'Paid' || status === 'paid') ? 'Paid' : 'Draft';
        await voucher.update({ status: paymentStatus }, { transaction: t });

        // Update bills status based on this payment
        await updateBillsForPayment(voucher.id, t);

        await t.commit();
        res.status(201).json({ ...voucher.toJSON(), status: paymentStatus });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.updatePayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { vendorId, paymentDate, paymentMode, paidThroughId, reference, amount, billAllocations, status, tds, depositToId, activeTab } = req.body;
        
        const oldVoucher = await Voucher.findByPk(id);
        if (!oldVoucher) return res.status(404).json({ error: "Payment not found" });

        const entries = [
            { ledgerId: paidThroughId, debit: 0, credit: amount }
        ];

        if (billAllocations && billAllocations.length > 0) {
            let totalAllocated = 0;
            for (const alloc of billAllocations) {
                if (alloc.amount > 0) {
                    entries.push({
                        ledgerId: vendorId,
                        debit: alloc.amount,
                        credit: 0,
                        description: `Payment for Bill ${alloc.billNumber || ''}. BILL_REF:${alloc.billId}`
                    });
                    totalAllocated += parseFloat(alloc.amount);
                }
            }
            const excess = amount - totalAllocated;
            if (excess > 0.01) {
                entries.push({
                    ledgerId: vendorId,
                    debit: excess,
                    credit: 0,
                    description: `Excess payment / Advance`
                });
            }
        } else {
            entries.push({
                ledgerId: vendorId,
                debit: amount,
                credit: 0,
                description: `Lump sum payment`
            });
        }

        let narrationText = `Payment Made via ${paymentMode}. Ref: ${reference}`;
        if (activeTab === 'Vendor Advance' || tds || depositToId) {
            const meta = { tds, depositToId, activeTab };
            narrationText += ` ||metadata:${JSON.stringify(meta)}`;
        }

        // Re-post accounting entries (AccountingService reverses old + writes new)
        const voucher = await AccountingService.updateJournalEntry(id, {
            companyId: oldVoucher.CompanyId,
            date: paymentDate,
            reference: reference || '',
            narration: narrationText,
            entries,
            userId: req.user?.id
        }, t);

        // Persist status if provided
        if (status) {
            const paymentStatus = (status === 'Paid' || status === 'paid') ? 'Paid' : 'Draft';
            await voucher.update({ status: paymentStatus }, { transaction: t });
        }

        // Update bills status based on this payment
        await updateBillsForPayment(voucher.id, t);

        await t.commit();
        res.json({ ...voucher.toJSON(), status: voucher.status });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

exports.markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;

        const voucher = await Voucher.findByPk(id, {
            include: [{ model: Transaction }]
        });
        if (!voucher) return res.status(404).json({ error: 'Payment not found' });
        if (voucher.voucherType !== 'Payment') {
            return res.status(400).json({ error: 'This voucher is not a Payment record' });
        }

        // 1. Update payment status to Paid
        await voucher.update({ status: 'Paid' });

        // 2. Update linked bill statuses
        await updateBillsForPayment(voucher.id);

        res.json({ 
            message: 'Payment marked as Paid successfully.',
            id: voucher.id,
            status: 'Paid'
        });
    } catch (err) {
        console.error('markAsPaid error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Voucher.findByPk(id, {
            include: [{ model: Transaction, include: [{ model: Ledger, attributes: ['name', 'id'] }] }]
        });
        if (!payment) return res.status(404).json({ error: "Payment not found" });

        const vendorId = payment.Transactions.find(t => parseFloat(t.debit) > 0)?.LedgerId || null;
        const paidThroughId = payment.Transactions.find(t => parseFloat(t.credit) > 0)?.LedgerId || null;

        // Build allocations and fetch the original bill details for each allocation
        const billAllocations = [];
        const billRows = [];

        for (const t of payment.Transactions.filter(tx => parseFloat(tx.debit) > 0)) {
            const match = (t.description || '').match(/BILL_REF:([\w-]+)/);
            console.log("Tx description:", t.description, "Match:", match);
            const billId = match ? match[1] : null;
            let billNumber = null;

            if (billId) {
                try {
                    const bill = await Voucher.findByPk(billId, { include: [{ model: Transaction }] });
                    if (bill) {
                        billNumber = bill.voucherNumber;
                        const vendorTx = bill.Transactions.find(tx => tx.LedgerId === vendorId && parseFloat(tx.credit || 0) > 0);
                        const billAmount = parseFloat(vendorTx?.credit || 0);

                        let dueDate = null;
                        let ref = bill.reference || '';
                        try {
                            const nd = typeof bill.narration === 'string' ? JSON.parse(bill.narration) : bill.narration;
                            dueDate = nd?.dueDate || null;
                            if (!ref) ref = nd?.notes || '';
                        } catch (e) {}

                        billRows.push({
                            id: bill.id,
                            billNumber: bill.voucherNumber,
                            date: bill.date,
                            dueDate,
                            totalAmount: billAmount,
                            amountPaid: parseFloat(t.debit),
                            balanceDue: parseFloat(t.debit),
                            balance: parseFloat(t.debit),
                            reference: ref
                        });
                    }
                } catch (e) { /* skip */ }
            }

            billAllocations.push({ billId, amount: parseFloat(t.debit), billNumber });
        }

        // Extract payment mode from narration
        let paymentMode = 'Bank Transfer';
        const modeMatch = (payment.narration || '').match(/Payment Made via (.+?)\./);
        if (modeMatch) paymentMode = modeMatch[1].trim();

        let tds = '';
        let depositToId = '';
        let activeTab = 'Bill Payment';
        let notes = payment.narration || '';

        if (payment.narration && payment.narration.includes('||metadata:')) {
            try {
                const parts = payment.narration.split('||metadata:');
                notes = parts[0].trim();
                const meta = JSON.parse(parts[1]);
                tds = meta.tds || '';
                depositToId = meta.depositToId || '';
                activeTab = meta.activeTab || 'Bill Payment';
            } catch (e) {
                console.error("Failed to parse narration metadata:", e);
            }
        }

        const totalAmount = payment.Transactions.reduce((s, t) => s + parseFloat(t.debit || 0), 0);

        res.json({
            id: payment.id,
            vendorId,
            paidThroughId,
            paymentNumber: payment.voucherNumber,
            paymentMade: totalAmount,
            paymentDate: payment.date?.toISOString?.().split('T')[0] || '',
            paymentMode,
            reference: payment.reference || '',
            notes: notes,
            tds,
            depositToId,
            activeTab,
            billAllocations,
            billRows // full row data to pre-populate the bills table
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.deletePayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const voucher = await Voucher.findByPk(id, {
            include: [{ model: Transaction }]
        });
        if (!voucher) return res.status(404).json({ error: "Payment not found" });

        // Get linked bill IDs before deletion
        const billIds = [];
        if (voucher.Transactions) {
            for (const tx of voucher.Transactions) {
                const match = (tx.description || '').match(/BILL_REF:([\w-]+)/);
                if (match) billIds.push(match[1]);
            }
        }

        await AccountingService.deleteJournalEntry(id, { 
            companyId: voucher.CompanyId, 
            userId: req.user?.id 
        }, t);

        // Update each linked bill's status after deleting this payment
        for (const billId of billIds) {
            const bill = await Voucher.findByPk(billId, {
                include: [{ model: Transaction }],
                transaction: t
            });
            if (!bill || bill.voucherType !== 'Purchase') continue;

            const vendorTx = bill.Transactions?.find(tx => parseFloat(tx.credit || 0) > 0);
            const billTotal = parseFloat(vendorTx?.credit || 0);

            // Sum payments against this bill that are 'Paid' (excluding current payment because it is deleted)
            const allPayments = await Transaction.findAll({
                where: { 
                    CompanyId: bill.CompanyId,
                    description: { [Op.like]: `%BILL_REF:${billId}%` },
                    VoucherId: { [Op.ne]: id }
                },
                include: [{
                    model: Voucher,
                    where: { status: 'Paid', CompanyId: bill.CompanyId }
                }],
                transaction: t
            });
            const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);

            let billStatus;
            if (totalPaid >= billTotal - 0.01) {
                billStatus = 'PAID';
            } else if (totalPaid > 0) {
                billStatus = 'PARTIALLY_PAID';
            } else {
                billStatus = 'OPEN';
            }

            await bill.update({ status: billStatus }, { transaction: t });
        }

        await t.commit();
        res.json({ message: "Payment deleted successfully" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const { companyId } = req.params;
        const payments = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Payment'
            },
            include: [{
                model: Transaction,
                where: { debit: { [Op.gt]: 0 } }, // Vendor side (debit > 0)
                include: [{ model: Ledger, attributes: ['name'] }]
            }],
            order: [['date', 'DESC']]
        });

        // Group by Voucher to show one line per payment
        const result = payments.map(p => {
            const totalAmount = p.Transactions.reduce((sum, t) => sum + parseFloat(t.debit), 0);
            
            // Extract bill numbers from descriptions
            const billNumbers = p.Transactions
                .map(t => {
                    const match = (t.description || '').match(/Payment for Bill (.*?)\./);
                    return match ? match[1] : null;
                })
                .filter(Boolean);
            
            // Calculate unused amount (advance / excess payment)
            const unusedAmount = p.Transactions
                .filter(t => !(t.description || '').includes('BILL_REF'))
                .reduce((sum, t) => sum + parseFloat(t.debit), 0);

            return {
                id: p.id,
                date: p.date,
                paymentNumber: p.voucherNumber,
                vendorName: p.Transactions[0]?.Ledger?.name || 'N/A',
                reference: p.reference,
                amount: totalAmount,
                unusedAmount: parseFloat(unusedAmount.toFixed(2)),
                billNo: billNumbers.length > 0 ? [...new Set(billNumbers)].join(', ') : '---',
                narration: p.narration,
                status: p.status || 'Draft' // Return persisted status, default to Draft for legacy records
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
