const { RetainerInvoice, Company } = require('../../models');
const PDFService = require('../../services/PDFService');
const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, toEmail } = req.body;

    const retainer = await RetainerInvoice.findByPk(id);
    if (!retainer) return res.status(404).json({ error: 'Invoice not found' });

    const items = JSON.parse(retainer.itemsJson || '[]');
    const pdfBuffer = await PDFService.generateRetainerInvoice(retainer, items);

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
      subject: subject || `Retainer Invoice ${retainer.invoiceNumber}`,
      text: body,
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

    const retainer = await RetainerInvoice.findByPk(id);
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
    const retainer = await RetainerInvoice.findByPk(req.params.id);
    if (!retainer) return res.status(404).json({ error: 'Retainer Invoice not found' });
    await retainer.destroy();
    res.json({ message: 'Retainer Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
