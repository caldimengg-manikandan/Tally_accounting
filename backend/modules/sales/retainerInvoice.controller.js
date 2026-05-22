const { RetainerInvoice, Company, Ledger } = require('../../models');
const PDFService = require('../../services/PDFService');
const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, toEmail } = req.body;

    const retainer = await RetainerInvoice.findByPk(id, {
      include: [{ model: Ledger, as: 'CustomerLedger' }]
    });
    if (!retainer) return res.status(404).json({ error: 'Invoice not found' });

    const finalToEmail = toEmail || retainer.CustomerLedger?.email;
    if (!finalToEmail) {
        return res.status(400).json({ error: 'Recipient email is missing. Please provide one or update the customer ledger.' });
    }

    const items = JSON.parse(retainer.itemsJson || '[]');
    const pdfBuffer = await PDFService.generateRetainerInvoice(retainer, items);

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

    const fromEmail = userEmail;
    if (!finalToEmail) return res.status(400).json({ error: 'Recipient email is required' });

    const mailOptions = {
      from: `"Indus CAI" <${fromEmail}>`,
      to: finalToEmail,
      subject: subject || `Retainer Invoice ${retainer.invoiceNumber}`,
      text: body || `Dear Customer,\n\nPlease find attached Retainer Invoice ${retainer.invoiceNumber}.`,
      attachments: [{ filename: `${retainer.invoiceNumber}.pdf`, content: pdfBuffer }]
    };

    await transporter.sendMail(mailOptions);
    await retainer.update({ status: 'Sent' });
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    // Convert items array to JSON string for storage if it's an array
    if (data.items && Array.isArray(data.items)) {
       data.itemsJson = JSON.stringify(data.items);
    }
    const retainer = await RetainerInvoice.create(data);
    res.status(201).json(retainer);
  } catch (error) {
    console.error('Create Retainer Invoice Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getByCompany = async (req, res) => {
  try {
    const retainers = await RetainerInvoice.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{ model: Ledger, as: 'CustomerLedger', attributes: ['name', 'currency'] }],
      order: [['invoiceDate', 'DESC']]
    });
    res.json(retainers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[RetainerInvoice] Fetching single info for ID: "${id}"`);
    
    if (!id || id === 'undefined' || id === '[object Object]') {
       return res.status(400).json({ error: 'Invalid ID provided' });
    }

    const retainer = await RetainerInvoice.findByPk(id, {
        include: [{ model: Ledger, as: 'CustomerLedger', attributes: ['name', 'currency', 'email'] }]
    });
    if (!retainer) {
        console.error(`[RetainerInvoice] NO RECORD FOUND for ID: ${id}`);
        return res.status(404).json({ error: `Retainer Invoice with ID ${id} was not found in database.` });
    }
    res.json(retainer);
  } catch (error) {
    console.error(`[RetainerInvoice] CRITICAL FETCH ERROR:`, error);
    res.status(500).json({ error: 'Database fetch failed: ' + error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const retainer = await RetainerInvoice.findByPk(req.params.id);
    if (!retainer) return res.status(404).json({ error: 'Retainer Invoice not found' });
    
    const data = { ...req.body };
    if (data.items && Array.isArray(data.items)) {
       data.itemsJson = JSON.stringify(data.items);
    }

    await retainer.update(data);
    res.json(retainer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { RetainerAdjustment } = require('../../models');
    const retainer = await RetainerInvoice.findByPk(req.params.id);
    if (!retainer) return res.status(404).json({ error: 'Retainer Invoice not found' });
    
    // Safety: Delete related adjustments first if they exist
    await RetainerAdjustment.destroy({ where: { RetainerInvoiceId: req.params.id } });
    
    await retainer.destroy();
    res.json({ message: 'Retainer Invoice deleted' });
  } catch (error) {
    console.error('Delete Retainer Error:', error);
    res.status(500).json({ error: error.message });
  }
};
exports.recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountReceived } = req.body;
    
    const retainer = await RetainerInvoice.findByPk(id);
    if (!retainer) return res.status(404).json({ error: 'Retainer not found' });

    const newReceived = parseFloat(retainer.amountReceived || 0) + parseFloat(amountReceived);
    let status = 'Partial';
    if (newReceived >= parseFloat(retainer.totalAmount)) status = 'Paid';

    await retainer.update({ amountReceived: newReceived, status });
    res.json(retainer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.applyToInvoice = async (req, res) => {
  try {
    const { id } = req.params; // Retainer ID
    const { invoiceId, amountToAdjust, CompanyId } = req.body;
    const { RetainerAdjustment } = require('../../models');

    const retainer = await RetainerInvoice.findByPk(id);
    if (!retainer) return res.status(404).json({ error: 'Retainer not found' });

    const available = parseFloat(retainer.amountReceived || 0) - parseFloat(retainer.amountUsed || 0);
    if (available < amountToAdjust) {
      return res.status(400).json({ error: 'Insufficient available retainer balance' });
    }

    // Create adjustment record
    await RetainerAdjustment.create({
      RetainerInvoiceId: id,
      InvoiceId: invoiceId,
      amountToAdjust,
      CompanyId
    });

    // Update retainer
    const newUsed = parseFloat(retainer.amountUsed || 0) + parseFloat(amountToAdjust);
    let status = retainer.status;
    if (newUsed >= parseFloat(retainer.totalAmount)) {
      status = 'FullyApplied';
    } else if (newUsed > 0) {
      status = 'PartiallyApplied';
    }

    await retainer.update({ amountUsed: newUsed, status });
    res.json({ message: 'Retainer applied successfully', retainer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
