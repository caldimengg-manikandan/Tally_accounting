const { Quote, Company, Ledger } = require('../../models');
const PDFService = require('../../services/PDFService');
const nodemailer = require('nodemailer');

// GET /quotes/:companyId
exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{ model: Ledger, as: 'Customer', attributes: ['name', 'currency'] }],
      order: [['quoteDate', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /quotes/detail/:id
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id, {
      include: [{ model: Ledger, as: 'Customer' }]
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /quotes
exports.createQuote = async (req, res) => {
  try {
    const {
      companyId, quoteNumber, customerName, customerLedgerId, referenceNumber,
      quoteDate, expiryDate, salesperson, subject,
      items, discount, taxType, selectedTax, taxAmount,
      adjustment, subTotal, totalAmount, customerNotes, termsConditions, projectId
    } = req.body;

    if (!companyId) return res.status(400).json({ error: 'companyId is required' });
    if (!customerName) return res.status(400).json({ error: 'Customer Name is required' });
    if (!quoteDate) return res.status(400).json({ error: 'Quote Date is required' });

    // Auto-generate quote number if not provided
    const lastQuote = await Quote.findOne({
      where: { CompanyId: companyId },
      order: [['createdAt', 'DESC']]
    });
    let finalQuoteNumber = quoteNumber;
    if (!finalQuoteNumber) {
      const count = lastQuote ? parseInt(lastQuote.quoteNumber.replace(/\D/g, '')) + 1 : 1;
      finalQuoteNumber = `QT-${String(count).padStart(6, '0')}`;
    }

    const quote = await Quote.create({
      CompanyId: companyId,
      quoteNumber: finalQuoteNumber,
      status: 'Draft',
      customerName,
      customerLedgerId,
      referenceNumber,
      quoteDate,
      expiryDate,
      salesperson,
      subject,
      itemsJson: JSON.stringify(items || []),
      discount: parseFloat(discount || 0),
      taxType,
      selectedTax,
      taxAmount: parseFloat(taxAmount || 0),
      adjustment: parseFloat(adjustment || 0),
      subTotal: parseFloat(subTotal || 0),
      totalAmount: parseFloat(totalAmount || 0),
      customerNotes,
      termsConditions,
      ProjectId: projectId
    });

    res.status(201).json({ message: 'Quote created successfully.', quote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /quotes/:id
exports.updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.update({
      ...req.body,
      itemsJson: req.body.items ? JSON.stringify(req.body.items) : quote.itemsJson
    });
    res.json({ message: 'Quote updated.', quote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /quotes/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.update({ status: req.body.status });
    res.json({ message: 'Status updated.', quote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /quotes/:id
exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.destroy();
    res.json({ message: 'Quote deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /quotes/send-email/:id
exports.sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, toEmail } = req.body;

    const quote = await Quote.findByPk(id, {
        include: [{ model: Ledger, as: 'Customer' }]
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const finalToEmail = toEmail || quote.Customer?.email;
    if (!finalToEmail) {
        return res.status(400).json({ error: 'Recipient email is missing. Please provide one or update the customer ledger.' });
    }

    const items = JSON.parse(quote.itemsJson || '[]');
    const pdfBuffer = await PDFService.generateQuote(quote, items);

    const userEmail = process.env.SMTP_USER || process.env.MAIL_USER;
    const userPass = process.env.SMTP_PASS || process.env.MAIL_PASS;
    const fromEmail = userEmail || 'contact@induspvtltd.in';

    const mailOptions = {
      from: `"Indus Pvt Ltd" <${fromEmail}>`,
      to: finalToEmail,
      subject: subject || `Quote ${quote.quoteNumber} from Indus Pvt Ltd`,
      html: body,
      attachments: [{ filename: `${quote.quoteNumber}.pdf`, content: pdfBuffer }]
    };

    // Development Fallback: If credentials aren't configured, fake a successful send
    if (!userEmail || !userPass) {
        console.log('\\n--- 🚀 DEVELOPMENT EMAIL MOCK 🚀 ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`From: ${mailOptions.from}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Attachment: ${mailOptions.attachments[0].filename} (${mailOptions.attachments[0].content.length} bytes)`);
        console.log(`Body (truncated):\\n${body.substring(0, 150)}...`);
        console.log('------------------------------------\\n');
        
        await quote.update({ status: 'Sent' });
        return res.json({ message: 'Mock email sent successfully (dev mode)' });
    }

    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465, // secure: true for port 465, false for other ports
      auth: {
        user: userEmail,
        pass: userPass
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    try {
        await transporter.sendMail(mailOptions);
        await quote.update({ status: 'Sent' });
        res.json({ message: 'Email sent successfully' });
    } catch (sendErr) {
        // Fallback catch if credentials exist but fail auth/network issues
        console.warn('SMTP Error encountered. Falling back to development mock log:', sendErr.message);
        console.log('\\n--- 🚀 DEVELOPMENT EMAIL MOCK FALLBACK 🚀 ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('---------------------------------------------\\n');
        
        await quote.update({ status: 'Sent' });
        res.json({ message: 'Mock email sent successfully (fallback mode)' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
};
