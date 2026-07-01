const { SystemMail, Company, Ledger, User } = require('../../models');
const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res, next) => {
  try {
    const { toEmail, subject, body, ledgerId, companyId, type } = req.body;
    const senderId = req.user.id;

    if (!toEmail || !subject || !body || !companyId || !ledgerId) {
      return res.status(400).json({ error: 'Missing required fields (toEmail, subject, body, ledgerId, companyId)' });
    }

    // IMMEDIATELY RETURN RESPONSE TO CLIENT TO PREVENT UI BLOCKING
    res.status(201).json({
      message: 'Email queued for processing'
    });

    // BACKGROUND PROCESSING
    setImmediate(async () => {
      try {
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

                let pdfBuffer;
                if (fs.existsSync(filePath)) {
                    pdfBuffer = fs.readFileSync(filePath);
                } else {
                    const { PurchaseOrder, Ledger, Company } = require('../../models');
                    const PDFService = require('../../services/PDFService');
                    const order = await PurchaseOrder.findByPk(documentId, {
                        include: [{ model: Ledger }, { model: Company }]
                    });
                    if (order) {
                        const vendor  = order.Ledger  || {};
                        const companyObj = order.Company || {};
                        let items = [];
                        try { items = JSON.parse(order.itemsJson || '[]'); } catch (e) { items = []; }
                        pdfBuffer = await PDFService.generatePurchaseOrder(order, items, companyObj, vendor);
                        const tempDir = path.dirname(filePath);
                        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                        fs.writeFileSync(filePath, pdfBuffer);
                    }
                }

                if (pdfBuffer) {
                    const { PurchaseOrder } = require('../../models');
                    const order = await PurchaseOrder.findByPk(documentId, { attributes: ['orderNumber', 'CompanyId'] });
                    attachments.push({
                        filename: `PurchaseOrder_${order?.orderNumber || documentId}.pdf`,
                        content: pdfBuffer
                    });
                }
            }
        }

        if (type === 'Quote') {
            const { Quote, Company, Ledger } = require('../../models');
            const PDFService = require('../../services/PDFService');
            const { documentId } = req.body;
            
            if (documentId) {
                const quote = await Quote.findByPk(documentId, {
                    include: [{ model: Ledger, as: 'CustomerLedger' }, { model: Company }]
                });
                if (quote) {
                    let items = [];
                    try { items = JSON.parse(quote.itemsJson || '[]'); } catch (e) {}
                    const pdfBuffer = await PDFService.generateQuote(quote, items, quote.Company);
                    attachments.push({
                        filename: `Quote_${quote.quoteNumber}.pdf`,
                        content: pdfBuffer
                    });
                }
            }
        }

        if (type === 'Sales Order') {
            const { SalesOrder, SalesOrderItem, Company, Ledger, Item } = require('../../models');
            const PDFService = require('../../services/PDFService');
            const { documentId } = req.body;
            
            if (documentId) {
                const order = await SalesOrder.findByPk(documentId, {
                    include: [
                        { model: Ledger, as: 'CustomerLedger' },
                        { model: Company },
                        { model: SalesOrderItem, as: 'items', include: [{ model: Item }] }
                    ]
                });
                if (order) {
                    const pdfBuffer = await PDFService.generateSalesOrder(order, order.items, order.Company);
                    attachments.push({
                        filename: `SalesOrder_${order.orderNumber}.pdf`,
                        content: pdfBuffer
                    });
                }
            }
        }

        if (type === 'Receipt') {
            const { InvoicePayment, SalesInvoice, Company, Ledger, Group } = require('../../models');
            const PDFService = require('../../services/PDFService');
            const { documentId } = req.body;
            
            if (documentId) {
                const payment = await InvoicePayment.findByPk(documentId, {
                    include: [
                        { 
                            model: SalesInvoice, 
                            include: [
                                { model: Ledger, as: 'CustomerLedger' },
                                { model: Company }
                            ]
                        },
                        { 
                            model: Ledger, as: 'DepositLedger',
                            include: [{ model: Group }]
                        }
                    ],
                });
                if (payment && !payment.Company) {
                     payment.Company = await Company.findByPk(payment.CompanyId);
                }
                
                if (payment) {
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
            console.error('SMTP credentials are not configured on the server.');
            return;
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
          await transporter.sendMail(mailOptions);
        } catch (mailErr) {
          console.error('Nodemailer Error:', mailErr);
          mailStatus = 'Failed';
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

        // 3. Update Statuses
        if (type === 'Invoice' && (mailStatus === 'Sent' || mailStatus === 'Sent (Mock)')) {
            const { SalesInvoice } = require('../../models');
            if (req.body.documentId) {
                await SalesInvoice.update({ status: 'Sent' }, { where: { id: req.body.documentId } });
            }
        }

        if (type === 'Purchase Order' && (mailStatus === 'Sent' || mailStatus === 'Sent (Mock)')) {
            const { PurchaseOrder } = require('../../models');
            if (req.body.documentId) {
                await PurchaseOrder.update({ status: 'issued', billed_status: 'yet_to_be_billed' }, { where: { id: req.body.documentId } });
            }
        }

        if (type === 'Sales Order' && (mailStatus === 'Sent' || mailStatus === 'Sent (Mock)')) {
            const { SalesOrder } = require('../../models');
            if (req.body.documentId) {
                await SalesOrder.update({ status: 'Sent' }, { where: { id: req.body.documentId } });
            }
        }
      } catch (err) {
          console.error('Background Email Processing Error:', err);
      }
    });
  } catch (err) {
    console.error('Mail Controller Error:', err);
    res.status(500).json({ error: 'Internal server error while initializing mail processing' });
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
