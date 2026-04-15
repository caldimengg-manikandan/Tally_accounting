const { Voucher, Transaction, Ledger, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getUnpaidBills = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { companyId } = req.query;

        // 1. Get all 'Purchase' vouchers (Bills) for this vendor
        // We find vouchers that have a Credit transaction to this vendor
        const bills = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Purchase'
            },
            include: [{
                model: Transaction,
                where: { LedgerId: vendorId, type: 'Cr' },
                required: true
            }],
            order: [['date', 'ASC']]
        });

        // 2. For each bill, calculate the amount paid so far
        // We look for 'Payment' vouchers that have a Debit transaction referencing this bill
        // For now, we'll implement a simple "Outstanding" logic
        const billsWithBalance = await Promise.all(bills.map(async (bill) => {
            const billAmount = parseFloat(bill.Transactions[0].credit);
            
            // Find payments linked to this bill
            // We'll search in the narration of transactions for the Bill ID
            const payments = await Transaction.findAll({
                where: {
                    LedgerId: vendorId,
                    type: 'Dr',
                    narration: { [Op.like]: `%BILL_REF:${bill.id}%` }
                }
            });

            const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.debit), 0);
            const balance = billAmount - amountPaid;

            return {
                id: bill.id,
                billNumber: bill.voucherNumber,
                date: bill.date,
                totalAmount: billAmount,
                amountPaid: amountPaid,
                balance: balance,
                reference: bill.reference
            };
        }));

        // Only return bills that aren't fully paid
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
            type: 'Cr',
            credit: parseFloat(amount),
            debit: 0,
            narration: `Payment to Vendor`
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
                        type: 'Dr',
                        debit: parseFloat(alloc.amount),
                        credit: 0,
                        narration: `Payment for Bill ${alloc.billNumber || ''}. BILL_REF:${alloc.billId}`
                    }, { transaction: t });
                }
            }
        } else {
            // Lump sum payment
            await Transaction.create({
                VoucherId: voucher.id,
                LedgerId: vendorId,
                CompanyId: companyId,
                type: 'Dr',
                debit: parseFloat(amount),
                credit: 0,
                narration: `Lump sum payment`
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
                where: { type: 'Dr' }, // Vendor side
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
