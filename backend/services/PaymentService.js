const { 
  sequelize, PaymentGateway, PaymentTransaction, InvoicePayment, 
  PaymentWebhookLog, SalesInvoice, Company, Ledger, Group, 
  Voucher, Transaction, AuditLog 
} = require('../models');
const { decrypt } = require('../helpers/crypto');
const RazorpayProvider = require('./payment_providers/RazorpayProvider');
const AccountingService = require('./AccountingService');
const crypto = require('crypto');

class PaymentService {
  /**
   * Retrieves active gateway configuration and returns initialized provider subclass instance
   */
  static async getProviderInstance(companyId) {
    const gateway = await PaymentGateway.findOne({
      where: { companyId, isActive: true }
    });

    if (!gateway) {
      throw new Error('No active payment gateway configured for this company.');
    }

    // Decrypt credentials Json
    let credentials;
    try {
      const decrypted = decrypt(gateway.credentialsJson);
      credentials = JSON.parse(decrypted);
    } catch (err) {
      console.error('Failed to decrypt gateway credentials:', err);
      throw new Error('Failed to load gateway credentials configuration.');
    }

    let webhookSecret = gateway.webhookSecret;
    if (webhookSecret) {
      try {
        webhookSecret = decrypt(webhookSecret);
      } catch (err) {
        console.warn('Webhook secret decryption failed, using as plain text:', err.message);
      }
    }

    const config = {
      keyId: credentials.keyId,
      keySecret: credentials.keySecret,
      webhookSecret
    };

    if (gateway.provider.toLowerCase() === 'razorpay') {
      return {
        provider: new RazorpayProvider(config),
        gatewayRecord: gateway
      };
    }

    throw new Error(`Unsupported payment provider: ${gateway.provider}`);
  }

  /**
   * Generates a payment link for a sales invoice
   */
  static async generateInvoicePaymentLink(invoiceId, companyId) {
    const t = await sequelize.transaction();
    try {
      const invoice = await SalesInvoice.findByPk(invoiceId, {
        include: [{ model: Ledger, as: 'CustomerLedger' }],
        transaction: t
      });

      if (!invoice) throw new Error('Invoice not found.');
      if (String(invoice.CompanyId) !== String(companyId)) {
        throw new Error('Access denied: Invoice does not belong to this company.');
      }

      const balance = parseFloat(invoice.balance || invoice.totalAmount);
      if (balance <= 0) {
        throw new Error('Invoice is already fully paid.');
      }

      const { provider, gatewayRecord } = await this.getProviderInstance(companyId);

      // Verify share token exists
      if (!invoice.shareToken) {
        invoice.shareToken = crypto.randomBytes(16).toString('hex');
        invoice.shareExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }

      const company = await Company.findByPk(companyId, { transaction: t });
      const linkDetails = await provider.createPaymentLink(invoice, company);

      // Record transaction
      const transaction = await PaymentTransaction.create({
        companyId,
        invoiceId: invoice.id,
        gatewayId: gatewayRecord.id,
        gatewayPaymentLinkId: linkDetails.paymentLinkId,
        amount: balance,
        status: 'pending',
        currency: invoice.CustomerLedger?.currency || 'INR'
      }, { transaction: t });

      // Update invoice fields
      await invoice.update({
        paymentGatewayId: gatewayRecord.id,
        paymentLink: linkDetails.paymentLink,
        paymentStatus: 'pending',
        shareToken: invoice.shareToken,
        shareExpiresAt: invoice.shareExpiresAt
      }, { transaction: t });

      // Audit log
      if (AuditLog) {
        await AuditLog.create({
          action: 'GENERATE_PAYMENT_LINK',
          tableName: 'SalesInvoices',
          recordId: invoice.id,
          newData: {
            paymentLinkId: linkDetails.paymentLinkId,
            paymentLink: linkDetails.paymentLink,
            amount: balance
          },
          CompanyId: companyId
        }, { transaction: t });
      }

      await t.commit();
      return { paymentLink: linkDetails.paymentLink, transactionId: transaction.id };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Processes an incoming Razorpay Webhook event
   */
  static async handleRazorpayWebhook(headers, rawBody, body) {
    const signature = headers['x-razorpay-signature'];
    const eventType = body.event;
    
    console.log(`Received Webhook Event: ${eventType}`);

    // Capture webhook log
    const webhookLog = await PaymentWebhookLog.create({
      eventType,
      payload: body,
      signature,
      processed: false
    });

    if (eventType !== 'payment.captured' && eventType !== 'payment.failed' && eventType !== 'payment.link.expired') {
      console.log(`Ignoring unhandled webhook event: ${eventType}`);
      await webhookLog.update({ processed: true, processedAt: new Date() });
      return { status: 'ignored' };
    }

    // Retrieve payment details to find notes (containing companyId and invoiceId)
    const paymentEntity = body.payload?.payment?.entity;
    if (!paymentEntity) {
      throw new Error('Invalid webhook payload: Missing payment entity.');
    }

    const companyId = paymentEntity.notes?.companyId;
    const invoiceId = paymentEntity.notes?.invoiceId || paymentEntity.reference_id;

    if (!companyId || !invoiceId) {
      throw new Error('Missing companyId or invoiceId metadata in webhook payload.');
    }

    // Get active provider instance
    const { provider, gatewayRecord } = await this.getProviderInstance(companyId);

    // Verify webhook signature
    const isVerified = provider.verifyWebhook(rawBody, signature, gatewayRecord.webhookSecret ? decrypt(gatewayRecord.webhookSecret) : null);
    if (!isVerified) {
      throw new Error('Signature verification failed.');
    }

    await webhookLog.update({ gatewayId: gatewayRecord.id });

    // Handle capturing payment
    if (eventType === 'payment.captured') {
      const t = await sequelize.transaction();
      try {
        // Find existing transaction matching the link or link id
        let transaction = await PaymentTransaction.findOne({
          where: { 
            companyId,
            invoiceId,
            gatewayPaymentLinkId: paymentEntity.payment_link_id || ''
          },
          transaction: t
        });

        // Fallback search by invoiceId and pending status
        if (!transaction) {
          transaction = await PaymentTransaction.findOne({
            where: { 
              companyId,
              invoiceId,
              status: 'pending'
            },
            transaction: t
          });
        }

        if (!transaction) {
          // Create on the fly if not exists
          transaction = await PaymentTransaction.create({
            companyId,
            invoiceId,
            gatewayId: gatewayRecord.id,
            gatewayPaymentLinkId: paymentEntity.payment_link_id,
            amount: parseFloat(paymentEntity.amount) / 100,
            status: 'pending',
            currency: paymentEntity.currency
          }, { transaction: t });
        }

        // Check if transaction is already paid to prevent double-processing
        if (transaction.status === 'paid') {
          console.log(`Transaction ${transaction.id} already marked as paid.`);
          await t.rollback();
          await webhookLog.update({ processed: true, processedAt: new Date() });
          return { status: 'already_processed' };
        }

        const paymentAmount = parseFloat(paymentEntity.amount) / 100;
        const feeAmount = parseFloat(paymentEntity.fee || 0) / 100;
        const taxAmount = parseFloat(paymentEntity.tax || 0) / 100; // GST on fee

        // Update payment transaction details
        await transaction.update({
          gatewayTransactionId: paymentEntity.id,
          status: 'paid',
          gatewayResponse: paymentEntity,
          paymentReference: paymentEntity.acquirer_data?.bank_transaction_id || paymentEntity.id,
          paidAt: new Date(paymentEntity.created_at * 1000),
          gatewayFee: feeAmount,
          gatewayFeeGst: taxAmount,
          settlementAmount: paymentAmount - feeAmount
        }, { transaction: t });

        // Retrieve sales invoice
        const invoice = await SalesInvoice.findByPk(invoiceId, { transaction: t });
        if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found.`);

        // Double payment guard: check if this payment was already recorded in invoice_payments
        const duplicatePayment = await InvoicePayment.findOne({
          where: {
            companyId,
            invoiceId,
            transactionId: transaction.id
          },
          transaction: t
        });

        if (duplicatePayment) {
          console.log(`Payment mapping already exists for transaction ${transaction.id}.`);
          await t.rollback();
          await webhookLog.update({ processed: true, processedAt: new Date() });
          return { status: 'already_processed' };
        }

        // Calculate new paid balances
        const newPaid = parseFloat(invoice.amountPaid || 0) + paymentAmount;
        const newBalance = parseFloat(invoice.totalAmount) - newPaid;
        
        let newStatus = invoice.status;
        if (newBalance <= 0.01) {
          newStatus = newBalance < -0.01 ? 'Overpaid' : 'Paid';
        } else {
          newStatus = 'Partially Paid';
        }

        await invoice.update({
          amountPaid: newPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          paymentStatus: newStatus === 'Overpaid' ? 'paid' : newStatus.toLowerCase(),
          paymentReference: paymentEntity.id,
          paymentDate: new Date(paymentEntity.created_at * 1000)
        }, { transaction: t });

        // Setup Clearing Account Ledger (create if not exists)
        let clearingLedger = await Ledger.findOne({
          where: { CompanyId: companyId, name: 'Payment Gateway Clearing Account' },
          transaction: t
        });

        if (!clearingLedger) {
          const currentAssetsGroup = await Group.findOne({
            where: { CompanyId: companyId, name: 'Current Assets' },
            transaction: t
          });

          if (!currentAssetsGroup) {
            throw new Error('Current Assets group is not seeded in this company.');
          }

          clearingLedger = await Ledger.create({
            name: 'Payment Gateway Clearing Account',
            groupName: 'Current Assets',
            GroupId: currentAssetsGroup.id,
            CompanyId: companyId,
            openingBalance: 0,
            currentBalance: 0
          }, { transaction: t });
        }

        // Post Journal / Receipt Entry
        // Debit: Payment Gateway Clearing Account
        // Credit: Customer accounts receivable ledger
        const receiptVoucher = await AccountingService.recordJournalEntry({
          companyId,
          date: new Date(paymentEntity.created_at * 1000),
          voucherType: 'Receipt',
          narration: `Payment of ${paymentAmount} received online for Invoice #${invoice.invoiceNumber}. Ref: ${paymentEntity.id}`,
          reference: paymentEntity.id,
          entries: [
            { ledgerId: clearingLedger.id, debit: paymentAmount, credit: 0 },
            { ledgerId: invoice.customerLedgerId, debit: 0, credit: paymentAmount }
          ]
        }, t);

        // Record installment map row
        await InvoicePayment.create({
          companyId,
          invoiceId: invoice.id,
          transactionId: transaction.id,
          voucherId: receiptVoucher.id,
          amount: paymentAmount,
          paymentDate: new Date(paymentEntity.created_at * 1000),
          paymentMode: 'Gateway',
          reference: paymentEntity.id
        }, { transaction: t });

        // Log Audit Log
        if (AuditLog) {
          await AuditLog.create({
            action: 'PAYMENT_CAPTURED',
            tableName: 'SalesInvoices',
            recordId: invoice.id,
            newData: {
              amount: paymentAmount,
              transactionId: transaction.id,
              voucherId: receiptVoucher.id
            },
            CompanyId: companyId
          }, { transaction: t });
        }

        await t.commit();
        await webhookLog.update({ processed: true, processedAt: new Date() });
        return { status: 'success' };
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    if (eventType === 'payment.failed') {
      const transaction = await PaymentTransaction.findOne({
        where: { 
          companyId,
          invoiceId,
          gatewayPaymentLinkId: paymentEntity.payment_link_id || ''
        }
      });
      if (transaction) {
        await transaction.update({
          status: 'failed',
          gatewayTransactionId: paymentEntity.id,
          gatewayResponse: paymentEntity
        });
      }
      await webhookLog.update({ processed: true, processedAt: new Date() });
      return { status: 'failed_recorded' };
    }

    if (eventType === 'payment.link.expired') {
      const transaction = await PaymentTransaction.findOne({
        where: { 
          companyId,
          invoiceId,
          gatewayPaymentLinkId: paymentEntity.payment_link_id || ''
        }
      });
      if (transaction) {
        await transaction.update({ status: 'expired' });
      }
      await webhookLog.update({ processed: true, processedAt: new Date() });
      return { status: 'expired_recorded' };
    }

    return { status: 'unhandled' };
  }
}

module.exports = PaymentService;
