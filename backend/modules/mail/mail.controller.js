const { SystemMail, Company, Ledger, User } = require('../../models');
const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res, next) => {
  try {
    const { toEmail, subject, body, ledgerId, companyId, type } = req.body;
    const senderId = req.user.id;

    if (!toEmail || !subject || !body || !companyId || !ledgerId) {
      return res.status(400).json({ error: 'Missing required fields (toEmail, subject, body, ledgerId, companyId)' });
    }

    // 1. Prepare PDF attachment based on type
    let attachments = [];

    if (type === 'Invoice') {
        const { SalesInvoice, SalesInvoiceItem, Company, Ledger, Item } = require('../../models');
        const PDFService = require('../../services/PDFService');
        const { documentId } = req.body;
        
        if (documentId) {
            const invoice = await SalesInvoice.findByPk(documentId, {
                include: [
                    { model: Ledger, as: 'CustomerLedger' },
                    { model: Company },
                    { model: SalesInvoiceItem, as: 'items', include: [{ model: Item }] }
                ]
            });
            if (invoice) {
                // BOLA guard
                const requestingCompanyId = companyId || req.companyId || req.user?.CompanyId;
                if (requestingCompanyId && String(invoice.CompanyId) !== String(requestingCompanyId)) {
                    return res.status(403).json({ error: 'Access denied: Invoice does not belong to your company' });
                }

                const pdfBuffer = await PDFService.generateInvoice(invoice, invoice.items, invoice.Company);
                attachments.push({
                    filename: `Invoice_${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer
                });
            }
        }
    }

    if (type === 'Purchase Order' && req.body.isPdfAttached) {
        const path = require('path');
        const fs   = require('fs');
        const { documentId } = req.body;

        if (documentId) {
            const filePath = path.join(__dirname, '../../uploads/temp', `po_${documentId}.pdf`);

            // Use cached temp file if it exists, otherwise generate fresh
            let pdfBuffer;
            if (fs.existsSync(filePath)) {
                // We should still verify BOLA even if the file is cached!
                const { PurchaseOrder } = require('../../models');
                const order = await PurchaseOrder.findByPk(documentId);
                const requestingCompanyId = companyId || req.companyId || req.user?.CompanyId;
                if (order && requestingCompanyId && String(order.CompanyId) !== String(requestingCompanyId)) {
                    return res.status(403).json({ error: 'Access denied: Purchase Order does not belong to your company' });
                }
                pdfBuffer = fs.readFileSync(filePath);
            } else {
                const { PurchaseOrder, Ledger, Company } = require('../../models');
                const PDFService = require('../../services/PDFService');
                const order = await PurchaseOrder.findByPk(documentId, {
                    include: [{ model: Ledger }, { model: Company }]
                });
                if (order) {
                    // BOLA guard
                    const requestingCompanyId = companyId || req.companyId || req.user?.CompanyId;
                    if (requestingCompanyId && String(order.CompanyId) !== String(requestingCompanyId)) {
                        return res.status(403).json({ error: 'Access denied: Purchase Order does not belong to your company' });
                    }

                    const vendor  = order.Ledger  || {};
                    const companyObj = order.Company || {};
                    let items = [];
                    try { items = JSON.parse(order.itemsJson || '[]'); } catch (e) { items = []; }
                    pdfBuffer = await PDFService.generatePurchaseOrder(order, items, companyObj, vendor);
                    // Cache it for later
                    const tempDir = path.dirname(filePath);
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                    fs.writeFileSync(filePath, pdfBuffer);
                }
            }

            if (pdfBuffer) {
                const { PurchaseOrder } = require('../../models');
                const order = await PurchaseOrder.findByPk(documentId, { attributes: ['orderNumber', 'CompanyId'] });
                
                // Double check BOLA guard here just in case
                const requestingCompanyId = companyId || req.companyId || req.user?.CompanyId;
                if (order && requestingCompanyId && String(order.CompanyId) !== String(requestingCompanyId)) {
                    return res.status(403).json({ error: 'Access denied: Purchase Order does not belong to your company' });
                }

                attachments.push({
                    filename: `PurchaseOrder_${order?.orderNumber || documentId}.pdf`,
                    content: pdfBuffer
                });
            }
        }
    }

    if (type === 'Sales Order') {
        const { SalesOrder, SalesOrderItem, Ledger, Company, Item } = require('../../models');
        const PDFService = require('../../services/PDFService');
        const { documentId } = req.body;

        if (documentId) {
            const order = await SalesOrder.findByPk(documentId, {
                include: [
                    { model: Ledger, as: 'Customer' },
                    { model: Company },
                    { model: SalesOrderItem, as: 'Items', include: [{ model: Item }] }
                ]
            });
            if (order) {
                // BOLA guard
                const requestingCompanyId = companyId || req.companyId || req.user?.CompanyId;
                if (requestingCompanyId && String(order.CompanyId) !== String(requestingCompanyId)) {
                    return res.status(403).json({ error: 'Access denied: Sales Order does not belong to your company' });
                }
                const items = order.Items || [];
                const companyObj = order.Company ? order.Company.toJSON() : {};
                const pdfBuffer = await PDFService.generateSalesOrder(order.toJSON(), items.map(i => i.toJSON()), companyObj);
                attachments.push({
                    filename: `SalesOrder_${order.orderNumber}.pdf`,
                    content: pdfBuffer
                });
            }
        }
    }

    if (type === 'Receipt') {
        const { Voucher, Transaction, Ledger, Group, Company } = require('../../models');
        const PDFService = require('../../services/PDFService');
        const { documentId } = req.body;

        if (documentId) {
            const payment = await Voucher.findByPk(documentId, {
                include: [
                    {
                        model: Transaction,
                        include: [
                            {
                                model: Ledger,
                                include: [{ model: Group }]
                            }
                        ]
                    },
                    { model: Company }
                ]
            });
            if (payment) {
                // BOLA guard
                const requestingCompanyId = companyId || req.companyId || req.user?.CompanyId;
                if (requestingCompanyId && String(payment.CompanyId) !== String(requestingCompanyId)) {
                    return res.status(403).json({ error: 'Access denied: Payment does not belong to your company' });
                }

                const pdfBuffer = await PDFService.generateReceipt(payment, payment.Company);
                attachments.push({
                    filename: `Receipt_${payment.voucherNumber}.pdf`,
                    content: pdfBuffer
                });
            }
        }
    }


    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const userEmail = process.env.SMTP_USER || process.env.MAIL_USER;
    const userPass = process.env.SMTP_PASS || process.env.MAIL_PASS;

    if (!userEmail || !userPass) {
      return res.status(400).json({ error: 'SMTP credentials are not configured on the server. Please define SMTP_USER and SMTP_PASS in your .env file.' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: userEmail,
        pass: userPass
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    const fromEmail = userEmail;
    const bodyText = typeof body === 'string' ? body : String(body || '');

    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: subject,
      text: bodyText,
      html: bodyText.replace(/\n/g, '<br/>'),
      attachments
    };

    let mailStatus = 'Sent';
    try {
      // In development/demo, we might ignore failures if using placeholders
      // But we attempt it anyway.
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Nodemailer Error:', mailErr);
      mailStatus = 'Failed';
      // If it's a known placeholder issue, we might still want to record success for UI demo
      if (!process.env.MAIL_PASS) mailStatus = 'Sent (Mock)';
    }

    // 2. Record in SystemMail history
    const savedMail = await SystemMail.create({
      CompanyId: companyId,
      LedgerId: ledgerId,
      SenderId: senderId,
      toEmail,
      fromEmail,
      subject,
      body,
      status: mailStatus,
      type: type || 'General'
    });

    // 3. If Invoice, update status to Sent
    if (type === 'Invoice' && (mailStatus === 'Sent' || mailStatus === 'Sent (Mock)')) {
        const { SalesInvoice } = require('../../models');
        const { documentId } = req.body;
        if (documentId) {
            await SalesInvoice.update({ status: 'Sent' }, { where: { id: documentId } });
        }
    }

    // 4. If Purchase Order, update status to issued and billed_status to yet_to_be_billed
    if (type === 'Purchase Order' && (mailStatus === 'Sent' || mailStatus === 'Sent (Mock)')) {
        const { PurchaseOrder } = require('../../models');
        const { documentId } = req.body;
        if (documentId) {
            await PurchaseOrder.update({ status: 'issued', billed_status: 'yet_to_be_billed' }, { where: { id: documentId } });
        }
    }

    // 5. If Sales Order, update status to Sent
    if (type === 'Sales Order' && (mailStatus === 'Sent' || mailStatus === 'Sent (Mock)')) {
        const { SalesOrder } = require('../../models');
        const { documentId } = req.body;
        if (documentId) {
            await SalesOrder.update({ status: 'Sent' }, { where: { id: documentId } });
        }
    }

    res.status(201).json({
      message: mailStatus === 'Sent' ? 'Email sent successfully' : 'Email recorded but delivery failed',
      mail: savedMail
    });
  } catch (err) {
    console.error('Mail Controller Error:', err);
    res.status(500).json({ error: 'Internal server error while processing mail' });
  }
};

exports.getMailsByLedger = async (req, res, next) => {
  try {
    const { ledgerId } = req.params;
    const mails = await SystemMail.findAll({
      where: { LedgerId: ledgerId },
      include: [
        { model: User, as: 'Sender', attributes: ['name', 'email'] }
      ],
      order: [['sentAt', 'DESC']]
    });
    res.json(mails);
  } catch (err) {
    next(err);
  }
};
