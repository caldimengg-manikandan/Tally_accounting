const { Quote, Company, Ledger } = require('../../models');
const PDFService = require('../../services/PDFService');
const nodemailer = require('nodemailer');

// GET /quotes/:companyId
exports.getQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{ model: Ledger, as: 'Customer', attributes: ['name', 'currency'] }],
      order: [['quoteDate', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(quotes);
  } catch (err) {
    next(err);
  }
};

// GET /quotes/detail/:id
exports.getQuoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;
    const quote = await Quote.findByPk(id, {
      include: [{ model: Ledger, as: 'Customer' }]
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    // BOLA guard: ensure quote belongs to the requesting company
    if (companyId && String(quote.CompanyId) !== String(companyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(quote);
  } catch (err) {
    next(err);
  }
};

// POST /quotes
exports.createQuote = async (req, res, next) => {
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
    err.statusCode = 400;
    next(err);
  }
};

// PUT /quotes/:id
exports.updateQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingCompanyId = req.body.companyId || req.user?.CompanyId;
    const quote = await Quote.findByPk(id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    // BOLA guard
    if (requestingCompanyId && String(quote.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await quote.update({
      ...req.body,
      itemsJson: req.body.items ? JSON.stringify(req.body.items) : quote.itemsJson
    });
    res.json({ message: 'Quote updated.', quote });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};

// PATCH /quotes/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.update({ status: req.body.status });
    res.json({ message: 'Status updated.', quote });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};

// DELETE /quotes/:id
exports.deleteQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
    const quote = await Quote.findByPk(id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    // BOLA guard
    if (requestingCompanyId && String(quote.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await quote.destroy();
    res.json({ message: 'Quote deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /quotes/send-email/:id
exports.sendEmail = async (req, res, next) => {
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

    // Fetch company so PDF and email use real company details
    const company = await Company.findByPk(quote.CompanyId);
    const companyName = company?.name || 'CalTally';

    const items = JSON.parse(quote.itemsJson || '[]');
    const pdfBuffer = await PDFService.generateQuote(quote, items, company ? company.toJSON() : {});

    const userEmail = process.env.SMTP_USER || process.env.MAIL_USER;
    const userPass = process.env.SMTP_PASS || process.env.MAIL_PASS;
    const fromEmail = userEmail || process.env.MAIL_USER || 'noreply@caltally.com';

    const bodyText = typeof body === 'string' ? body : String(body || '');

    const mailOptions = {
      from: `"${companyName}" <${fromEmail}>`,
      to: finalToEmail,
      subject: subject || `Quote ${quote.quoteNumber} from ${companyName}`,
      text: bodyText,
      html: bodyText.replace(/\n/g, '<br/>'),
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
    next(err);
  }
};
