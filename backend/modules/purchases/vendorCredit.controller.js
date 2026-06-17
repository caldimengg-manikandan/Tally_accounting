   const { VendorCredit, VendorCreditItem, Voucher, Transaction, Ledger, Item } = require('../../models');
const { v4: uuidv4 } = require('uuid');

exports.getByCompany = async (req, res, next) => {
    try {
        const { companyId } = req.params;
        const credits = await VendorCredit.findAll({
            where: { CompanyId: companyId },
            include: [{ model: Ledger, as: 'Vendor' }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(credits);
    } catch (err) {
        next(err);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const credit = await VendorCredit.findOne({
            where: { id: req.params.id, CompanyId: req.companyId },
            include: [
                { model: Ledger, as: 'Vendor' },
                { model: Ledger, as: 'APAccount' },
                { 
                    model: VendorCreditItem, 
                    as: 'items',
                    include: [
                        { model: Item },
                        { model: Ledger, as: 'Account' }
                    ]
                }
            ]
        });
        if (!credit) return res.status(404).json({ error: 'Vendor Credit not found' });
        
        // BOLA guard
        const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
        if (requestingCompanyId && String(credit.CompanyId) !== String(requestingCompanyId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(credit);
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const {
            vendorCreditNumber, referenceNumber, date, status,
            vendorLedgerId, accountsPayableId, items,
            subTotal, taxAmount, adjustment, totalAmount,
            vendorNotes, termsConditions, companyId, projectId
        } = req.body;

        const credit = await VendorCredit.create({
            vendorCreditNumber, referenceNumber, date, status,
            vendorLedgerId, accountsPayableId,
            subTotal, taxAmount, adjustment, totalAmount,
            vendorNotes, termsConditions,
            CompanyId: req.companyId || companyId,
            ProjectId: projectId
        });

        if (items && items.length > 0) {
            await Promise.all(items.map(item => 
                VendorCreditItem.create({
                    ...item,
                    VendorCreditId: credit.id
                })
            ));
        }

        // --- ACCOUNTING INTEGRATION ---
        // For Vendor Credits (Returns), we DEBIT the Vendor (Accounts Payable) 
        // and CREDIT the Expense/Purchase account.
        
        const voucher = await Voucher.create({
            date,
            voucherType: 'Journal', // Credit Notes are often Journal entries
            voucherNumber: `VC-VOUCH-${vendorCreditNumber}`,
            narration: `Vendor Credit ${vendorCreditNumber}`,
            CompanyId: companyId,
            ProjectId: projectId || null
        });

        // 1. Debit Vendor (AP decreases)
        await Transaction.create({
            VoucherId: voucher.id,
            LedgerId: vendorLedgerId,
            debit: totalAmount,
            credit: 0,
            date,
            CompanyId: companyId,
            ProjectId: projectId || null
        });

        // 2. Credit Expense/Return accounts for each item
        for (const item of items) {
             await Transaction.create({
                VoucherId: voucher.id,
                LedgerId: item.accountId, // e.g. Purchase Returns or original expense
                debit: 0,
                credit: item.amount,
                date,
                CompanyId: companyId,
                ProjectId: projectId || null
             });
        }

        // Update link
        await credit.update({ VoucherId: voucher.id });

        res.status(201).json(credit);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { items, ...updateData } = req.body;

        const credit = await VendorCredit.findOne({ 
            where: { id, CompanyId: req.companyId } 
        });
        if (!credit) return res.status(404).json({ error: 'Record not found or access denied' });

        // BOLA guard
        const requestingCompanyId = req.body.CompanyId || req.body.companyId || req.user?.CompanyId;
        if (requestingCompanyId && String(credit.CompanyId) !== String(requestingCompanyId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await credit.update(updateData);

        if (items) {
            await VendorCreditItem.destroy({ where: { VendorCreditId: id } });
            await Promise.all(items.map(item => 
                VendorCreditItem.create({
                    ...item,
                    VendorCreditId: id
                })
            ));
        }
        
        // Note: Full voucher sync logic should go here for production, 
        // but often we recreate the voucher or update the transactions.
        
        res.json(credit);
    } catch (err) {
        next(err);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const credit = await VendorCredit.findOne({ 
            where: { id: req.params.id, CompanyId: req.companyId } 
        });
        if (!credit) return res.status(404).json({ error: 'Record not found or access denied' });
        
        // BOLA guard
        const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
        if (requestingCompanyId && String(credit.CompanyId) !== String(requestingCompanyId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (credit.VoucherId) {
            await Voucher.destroy({ where: { id: credit.VoucherId } });
        }
        
        await credit.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        next(err);
    }
};
