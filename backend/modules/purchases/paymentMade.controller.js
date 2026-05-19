const { Voucher, Transaction, Ledger, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getNextPaymentNumber = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Fetch all Payment voucherNumbers for this company
        const payments = await Voucher.findAll({
            where: { CompanyId: companyId, voucherType: 'Payment' },
            attributes: ['voucherNumber']
        });

        // Only consider purely numeric voucherNumbers (sequential ones we assigned)
        let maxNum = 0;
        payments.forEach(p => {
            const num = parseInt(p.voucherNumber, 10);
            if (!isNaN(num) && String(num) === p.voucherNumber && num > maxNum) {
                maxNum = num;
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

            // Find payments linked to this bill via BILL_REF description
            const paymentWhere = {
                LedgerId: vendorId,
                description: { [Op.like]: `%BILL_REF:${bill.id}%` }
            };
            if (excludePaymentId) {
                paymentWhere.VoucherId = { [Op.ne]: excludePaymentId };
            }

            const payments = await Transaction.findAll({
                where: paymentWhere
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
            companyId 
        } = req.body;

        if (!vendorId || !paidThroughId || !amount) {
            return res.status(400).json({ error: "Vendor, Paid Through, and Payment Made amount are required fields." });
        }

        // 1. Create the Payment Voucher
        const voucher = await Voucher.create({
            CompanyId: companyId,
            voucherType: 'Payment',
            voucherNumber: paymentNumber || `PAY-${Date.now()}`,
            date: paymentDate || new Date(),
            reference: reference || '',
            narration: `Payment Made via ${paymentMode}. Ref: ${reference}`
        }, { transaction: t });

        // 2. Credit the Bank/Cash account (Paid Through)
        await Transaction.create({
            VoucherId: voucher.id,
            LedgerId: paidThroughId,
            CompanyId: companyId,
            credit: parseFloat(amount),
            debit: 0,
            description: `Payment to Vendor`
        }, { transaction: t });

        // 3. Debit the Vendor Account
        // If billAllocations is provided, we create a transaction per bill for tracking
        if (billAllocations && billAllocations.length > 0) {
            for (const alloc of billAllocations) {
                if (alloc.amount > 0) {
                    await Transaction.create({
                        VoucherId: voucher.id,
                        LedgerId: vendorId,
                        CompanyId: companyId,
                        debit: parseFloat(alloc.amount),
                        credit: 0,
                        description: `Payment for Bill ${alloc.billNumber || ''}. BILL_REF:${alloc.billId}`
                    }, { transaction: t });
                }
            }
        } else {
            // Lump sum payment
            await Transaction.create({
                VoucherId: voucher.id,
                LedgerId: vendorId,
                CompanyId: companyId,
                debit: parseFloat(amount),
                credit: 0,
                description: `Lump sum payment`
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json(voucher);
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
        const { vendorId, paymentDate, paymentMode, paidThroughId, reference, amount, billAllocations } = req.body;
        
        const voucher = await Voucher.findByPk(id);
        if (!voucher) return res.status(404).json({ error: "Payment not found" });

        // 1. Destroy old transactions
        await Transaction.destroy({ where: { VoucherId: voucher.id }, transaction: t });

        // 2. Update Voucher
        voucher.date = paymentDate || voucher.date;
        voucher.reference = reference || voucher.reference;
        voucher.narration = `Payment Made via ${paymentMode}. Ref: ${reference}`;
        await voucher.save({ transaction: t });

        // 3. Re-create the Bank/Cash account credit
        await Transaction.create({
            VoucherId: voucher.id,
            LedgerId: paidThroughId,
            CompanyId: voucher.CompanyId,
            credit: parseFloat(amount),
            debit: 0,
            description: `Payment to Vendor`
        }, { transaction: t });

        // 4. Re-create the Vendor account debits
        if (billAllocations && billAllocations.length > 0) {
            for (const alloc of billAllocations) {
                if (alloc.amount > 0) {
                    await Transaction.create({
                        VoucherId: voucher.id,
                        LedgerId: vendorId,
                        CompanyId: voucher.CompanyId,
                        debit: parseFloat(alloc.amount),
                        credit: 0,
                        description: `Payment for Bill ${alloc.billNumber || ''}. BILL_REF:${alloc.billId}`
                    }, { transaction: t });
                }
            }
        } else {
            await Transaction.create({
                VoucherId: voucher.id,
                LedgerId: vendorId,
                CompanyId: voucher.CompanyId,
                debit: parseFloat(amount),
                credit: 0,
                description: `Lump sum payment`
            }, { transaction: t });
        }

        await t.commit();
        res.json(voucher);
    } catch (err) {
        await t.rollback();
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
            notes: payment.narration || '',
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
        const voucher = await Voucher.findByPk(id);
        if (!voucher) return res.status(404).json({ error: "Payment not found" });

        await Transaction.destroy({ where: { VoucherId: voucher.id }, transaction: t });
        await voucher.destroy({ transaction: t });

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
            return {
                id: p.id,
                date: p.date,
                paymentNumber: p.voucherNumber,
                vendorName: p.Transactions[0]?.Ledger?.name || 'N/A',
                reference: p.reference,
                amount: totalAmount,
                narration: p.narration
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
