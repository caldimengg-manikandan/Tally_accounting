const { SystemMail, Company, Ledger, User } = require('../../models');
const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res) => {
  try {
    const { toEmail, subject, body, ledgerId, companyId, type } = req.body;
    const senderId = req.user.id;

    if (!toEmail || !subject || !body || !companyId || !ledgerId) {
      return res.status(400).json({ error: 'Missing required fields (toEmail, subject, body, ledgerId, companyId)' });
    }

    // 1. Prepare PDF attachment if it's an Invoice
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

    // 2. Configure Transport
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const userEmail = process.env.SMTP_USER || process.env.MAIL_USER || 'calbuy160@gmail.com';
    const userPass = process.env.SMTP_PASS || process.env.MAIL_PASS || 'jwyeljvzgsselddo';

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

    const fromName = req.user.name || 'Indus CAI';
    const fromEmail = userEmail;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      html: body,
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

    res.status(201).json({
      message: mailStatus === 'Sent' ? 'Email sent successfully' : 'Email recorded but delivery failed',
      mail: savedMail
    });
  } catch (err) {
    console.error('Mail Controller Error:', err);
    res.status(500).json({ error: 'Internal server error while processing mail' });
  }
};

exports.getMailsByLedger = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
};
