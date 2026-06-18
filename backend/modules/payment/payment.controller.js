const { 
  PaymentGateway, PaymentTransaction, InvoicePayment, 
  SalesInvoice, Ledger, Company, Group, sequelize 
} = require('../../models');
const { encrypt, decrypt } = require('../../helpers/crypto');
const PaymentService = require('../../services/PaymentService');
const RazorpayProvider = require('../../services/payment_providers/RazorpayProvider');
const AccountingService = require('../../services/AccountingService');

exports.getGateways = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    if (!companyId) return res.status(400).json({ error: 'Company context required.' });

    const gateways = await PaymentGateway.findAll({
      where: { companyId }
    });

    // Mask secrets before sending to frontend
    const sanitized = gateways.map(gw => {
      let credentials = {};
      try {
        const decrypted = decrypt(gw.credentialsJson);
        credentials = JSON.parse(decrypted);
      } catch (err) {
        credentials = {};
      }

      return {
        id: gw.id,
        provider: gw.provider,
        displayName: gw.displayName,
        isActive: gw.isActive,
        isTestMode: gw.isTestMode,
        keyId: credentials.keyId || '',
        hasSecret: !!credentials.keySecret,
        hasWebhookSecret: !!gw.webhookSecret
      };
    });

    res.json(sanitized);
  } catch (err) {
    next(err);
  }
};

exports.saveGateway = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    if (!companyId) return res.status(400).json({ error: 'Company context required.' });

    const { provider, displayName, keyId, keySecret, webhookSecret, isActive, isTestMode } = req.body;

    if (!provider || !displayName || !keyId || !keySecret) {
      return res.status(400).json({ error: 'Provider, Display Name, Key ID, and Key Secret are required.' });
    }

    const credentialsString = JSON.stringify({ keyId, keySecret });
    const encryptedCredentials = encrypt(credentialsString);
    const encryptedWebhook = webhookSecret ? encrypt(webhookSecret) : null;

    // Check if configuration already exists for this provider
    let gateway = await PaymentGateway.findOne({
      where: { companyId, provider }
    });

    if (gateway) {
      await gateway.update({
        displayName,
        isActive: isActive || false,
        isTestMode: isTestMode !== undefined ? isTestMode : true,
        credentialsJson: encryptedCredentials,
        webhookSecret: encryptedWebhook
      });
    } else {
      gateway = await PaymentGateway.create({
        companyId,
        provider,
        displayName,
        isActive: isActive || false,
        isTestMode: isTestMode !== undefined ? isTestMode : true,
        credentialsJson: encryptedCredentials,
        webhookSecret: encryptedWebhook
      });
    }

    // If marked active, disable other gateways for this company
    if (isActive) {
      const { Op } = require('sequelize');
      await PaymentGateway.update(
        { isActive: false },
        { where: { companyId, id: { [Op.ne]: gateway.id } } }
      );
    }

    res.status(201).json({ message: 'Gateway configuration saved successfully.', id: gateway.id });
  } catch (err) {
    next(err);
  }
};

exports.updateGatewayStatus = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    const { id } = req.params;
    const { isActive } = req.body;

    const gateway = await PaymentGateway.findByPk(id);
    if (!gateway) return res.status(404).json({ error: 'Gateway not found.' });
    if (String(gateway.companyId) !== String(companyId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await gateway.update({ isActive });

    if (isActive) {
      const { Op } = require('sequelize');
      await PaymentGateway.update(
        { isActive: false },
        { where: { companyId, id: { [Op.ne]: id } } }
      );
    }

    res.json({ message: 'Gateway status updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.testConnection = async (req, res, next) => {
  try {
    const { provider, keyId, keySecret } = req.body;
    if (!provider || !keyId || !keySecret) {
      return res.status(400).json({ error: 'Provider, Key ID, and Key Secret are required to run test.' });
    }

    if (provider.toLowerCase() === 'razorpay') {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      // Query Razorpay Payments API to check credentials validity
      const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (response.ok) {
        return res.json({ success: true, message: 'Razorpay connection test succeeded!' });
      } else {
        const errorData = await response.json();
        return res.json({ success: false, message: errorData.error?.description || 'Connection failed: Unauthorized credentials.' });
      }
    }

    res.status(400).json({ error: 'Provider not supported for online test.' });
  } catch (err) {
    res.json({ success: false, message: `Connection failed: ${err.message}` });
  }
};

exports.generateLink = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    const { id } = req.params;

    const result = await PaymentService.generateInvoicePaymentLink(id, companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getInvoiceTransactions = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    const { id } = req.params; // invoice ID

    const transactions = await PaymentTransaction.findAll({
      where: { companyId, invoiceId: id },
      order: [['createdAt', 'DESC']]
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

exports.webhookRazorpay = async (req, res, next) => {
  try {
    const result = await PaymentService.handleRazorpayWebhook(req.headers, req.rawBody, req.body);
    res.json(result);
  } catch (err) {
    console.error('Webhook processing failed:', err.message);
    res.status(400).json({ error: err.message });
  }
};

// Banking Settlement Controller (manual settlement/reconciliation recording)
exports.recordSettlement = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    if (!companyId) return res.status(400).json({ error: 'Company context required.' });

    const { bankLedgerId, settlementAmount, gatewayFee, gatewayFeeGst, transactionIds, reference, date } = req.body;

    if (!bankLedgerId || !settlementAmount || !transactionIds || transactionIds.length === 0) {
      return res.status(400).json({ error: 'Bank account, settlement amount, and payment transactions list are required.' });
    }

    // Gross amount cleared
    const feeTotal = parseFloat(gatewayFee || 0) + parseFloat(gatewayFeeGst || 0);
    const grossAmount = parseFloat(settlementAmount) + feeTotal;

    // Verify bank ledger exists
    const bankLedger = await Ledger.findByPk(bankLedgerId, { transaction: t });
    if (!bankLedger) throw new Error('Bank account ledger not found.');

    // Find clearing ledger
    let clearingLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: 'Payment Gateway Clearing Account' },
      transaction: t
    });

    if (!clearingLedger) {
      throw new Error('Clearing account ledger does not exist. No payments have been captured yet.');
    }

    // Setup Gateway Charges Ledger (create if not exists)
    let chargesLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: 'Payment Gateway Charges' },
      transaction: t
    });

    if (!chargesLedger) {
      const expensesGroup = await Group.findOne({
        where: { CompanyId: companyId, name: 'Indirect Expenses' },
        transaction: t
      });

      chargesLedger = await Ledger.create({
        name: 'Payment Gateway Charges',
        groupName: 'Indirect Expenses',
        GroupId: expensesGroup ? expensesGroup.id : null,
        CompanyId: companyId,
        openingBalance: 0,
        currentBalance: 0
      }, { transaction: t });
    }

    // Create Settlement Voucher (Journal Voucher type)
    // Debit: Bank Account (net settled amount)
    // Debit: Payment Gateway Charges (fee + tax)
    // Credit: Payment Gateway Clearing Account (gross amount)
    const settlementVoucher = await AccountingService.recordJournalEntry({
      companyId,
      date: date || new Date(),
      voucherType: 'Journal',
      narration: `Gateway settlement credit to Bank. Ref: ${reference || 'N/A'}. Gross: ${grossAmount}, Fees: ${feeTotal}`,
      reference,
      entries: [
        { ledgerId: bankLedger.id, debit: parseFloat(settlementAmount), credit: 0 },
        { ledgerId: chargesLedger.id, debit: feeTotal, credit: 0 },
        { ledgerId: clearingLedger.id, debit: 0, credit: grossAmount }
      ],
      userId: req.user?.id
    }, t);

    // Update transactions with settlement metadata
    const settlementId = reference || `SETTLE-${Date.now()}`;
    await PaymentTransaction.update({
      settlementId,
      settledAt: date || new Date(),
      settlementAmount: parseFloat(settlementAmount),
      gatewayFee: parseFloat(gatewayFee || 0),
      gatewayFeeGst: parseFloat(gatewayFeeGst || 0)
    }, {
      where: { id: transactionIds },
      transaction: t
    });

    await t.commit();
    res.json({ message: 'Settlement recorded successfully.', voucherId: settlementVoucher.id });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// Retrieve unsettled transactions for reconciliation UI
exports.getUnsettledTransactions = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.CompanyId;
    if (!companyId) return res.status(400).json({ error: 'Company context required.' });

    const transactions = await PaymentTransaction.findAll({
      where: { 
        companyId, 
        status: 'paid',
        settlementId: null // not yet settled
      },
      include: [{ model: SalesInvoice, attributes: ['invoiceNumber'] }],
      order: [['paidAt', 'ASC']]
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
};
