const { Quote, Company } = require('../../models');
const PDFService = require('../../services/PDFService');
const nodemailer = require('nodemailer');

// GET /quotes/:companyId
exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.findAll({
      where: { CompanyId: req.params.companyId },
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
    const quote = await Quote.findByPk(req.params.id);
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
      companyId, quoteNumber, customerName, referenceNumber,
      quoteDate, expiryDate, salesperson, subject,
      items, discount, taxType, selectedTax, taxAmount,
      adjustment, subTotal, totalAmount, customerNotes, termsConditions
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
      termsConditions
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

    const quote = await Quote.findByPk(id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const items = JSON.parse(quote.itemsJson || '[]');
    const pdfBuffer = await PDFService.generateQuote(quote, items);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'naveenswathi1811@gmail.com',
        pass: 'your-app-password' 
      }
    });

    const mailOptions = {
      from: `"Indus CAI" <naveenswathi1811@gmail.com>`,
      to: toEmail || 'thejathangavel05@gmail.com',
      subject: subject || `Quote ${quote.quoteNumber} from Indus CAI`,
      text: body,
      attachments: [{ filename: `${quote.quoteNumber}.pdf`, content: pdfBuffer }]
    };

    await transporter.sendMail(mailOptions);
    await quote.update({ status: 'Sent' });
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
};
