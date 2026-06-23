const { Company, Voucher, SalesInvoice, Ledger } = require('../models');
const { Op } = require('sequelize');

exports.enforceSubscription = async (req, res, next) => {
  try {
    // 1. Bypass check for Super Admin or non-company routes
    if (!req.companyId) return next();

    const company = await Company.findByPk(req.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const now = new Date();
    let currentStatus = company.subscriptionStatus;

    // 2. Evaluate Trial and Grace Period Expiry
    if (currentStatus === 'Trialing' && company.trialEndsAt && now > company.trialEndsAt) {
      currentStatus = 'Grace_Period';
      company.subscriptionStatus = currentStatus;
      await company.save();
    }

    if (currentStatus === 'Grace_Period' && company.trialEndsAt) {
      const graceEnd = new Date(company.trialEndsAt);
      graceEnd.setDate(graceEnd.getDate() + 7); // 7-Day Grace Period
      if (now > graceEnd) {
        currentStatus = 'Past_Due';
        company.subscriptionStatus = currentStatus;
        await company.save();
      }
    }

    // 3. Enforce Paywall (Read-Only Mode)
    if (currentStatus === 'Past_Due' || currentStatus === 'Canceled') {
      const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (modifyingMethods.includes(req.method)) {
        return res.status(403).json({
          error: 'PAYWALL_ACTIVE',
          message: 'Your subscription or trial has expired. Your account is in Read-Only mode. Please upgrade to create or edit records.'
        });
      }
    }

    // 4. Student Plan Restrictions (Only evaluated if Trialing or Active)
    if (company.accountType === 'Student' && ['POST'].includes(req.method)) {
      // Fast check based on route path
      if (req.path.includes('/vouchers')) {
        const voucherCount = await Voucher.count({ where: { CompanyId: company.id } });
        if (voucherCount >= 100) return res.status(403).json({ error: 'STUDENT_LIMIT', message: 'Student accounts are limited to 100 Vouchers. Please upgrade.' });
      }
      if (req.path.includes('/sales')) { // Invoices
        const invoiceCount = await SalesInvoice.count({ where: { CompanyId: company.id } });
        if (invoiceCount >= 50) return res.status(403).json({ error: 'STUDENT_LIMIT', message: 'Student accounts are limited to 50 Invoices. Please upgrade.' });
      }
      if (req.path.includes('/ledgers')) { // Customers/Vendors
        const ledgerCount = await Ledger.count({ where: { CompanyId: company.id } });
        // Keeping it simple: 40 total ledgers (Customers + Vendors combined)
        if (ledgerCount >= 40) return res.status(403).json({ error: 'STUDENT_LIMIT', message: 'Student accounts are limited to 40 Ledgers. Please upgrade.' });
      }
    }

    // Attach current status to request for downstream use if needed
    req.subscriptionStatus = currentStatus;
    next();

  } catch (err) {
    console.error('Subscription Middleware Error:', err);
    res.status(500).json({ error: 'Failed to verify subscription status' });
  }
};
