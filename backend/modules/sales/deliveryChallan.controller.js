const { DeliveryChallan, DeliveryChallanItem, Ledger, Item, Company, sequelize } = require('../../models');

exports.createChallan = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { 
      companyId, customerLedgerId, challanNumber, referenceNumber, date, 
      challanType, salesperson, subject, subTotal, discount, 
      taxAmount, adjustment, totalAmount, status, items, projectId 
    } = req.body;

    const challan = await DeliveryChallan.create({
      CompanyId: companyId,
      customerLedgerId,
      challanNumber,
      referenceNumber,
      date,
      challanType,
      salesperson,
      subject,
      subTotal,
      discount,
      taxAmount,
      adjustment,
      totalAmount,
      status: status || 'Draft',
      ProjectId: projectId
    }, { transaction: t });

    if (items && items.length > 0) {
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const challanItems = validItems.map(it => ({
        itemId: it.itemId,
        description: it.description,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0,
        amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
        DeliveryChallanId: challan.id
      }));
      if (challanItems.length > 0) {
        await DeliveryChallanItem.bulkCreate(challanItems, { transaction: t });
      }
    }

    await t.commit();
    res.status(201).json(challan);
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.getChallans = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const challans = await DeliveryChallan.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'currency'] }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(challans);
  } catch (err) {
    next(err);
  }
};

exports.getChallanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;
    const challan = await DeliveryChallan.findByPk(id, {
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'email', 'currency'] },
        { model: DeliveryChallanItem, as: 'items', include: [{ model: Item }] }
      ]
    });
    if (!challan) return res.status(404).json({ error: 'Challan not found' });
    // BOLA guard
    if (companyId && String(challan.CompanyId) !== String(companyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(challan);
  } catch (err) {
    next(err);
  }
};

exports.updateChallan = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      customerLedgerId, challanNumber, referenceNumber, date, 
      challanType, salesperson, subject, subTotal, discount, 
      taxAmount, adjustment, totalAmount, status, items, projectId, companyId
    } = req.body;

    const challan = await DeliveryChallan.findByPk(id);
    if (!challan) {
      await t.rollback();
      return res.status(404).json({ error: 'Challan not found' });
    }

    // BOLA guard
    const requestingCompanyId = companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(challan.CompanyId) !== String(requestingCompanyId)) {
      await t.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    await challan.update({
      customerLedgerId,
      challanNumber,
      referenceNumber,
      date,
      challanType,
      salesperson,
      subject,
      subTotal,
      discount,
      taxAmount,
      adjustment,
      totalAmount,
      status,
      ProjectId: projectId
    }, { transaction: t });

    if (items) {
      await DeliveryChallanItem.destroy({ where: { DeliveryChallanId: id }, transaction: t });
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const challanItems = validItems.map(it => ({
        itemId: it.itemId,
        description: it.description,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0,
        amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
        DeliveryChallanId: id
      }));
      if (challanItems.length > 0) {
        await DeliveryChallanItem.bulkCreate(challanItems, { transaction: t });
      }
    }

    await t.commit();
    res.json(challan);
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.deleteChallan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;

    const challan = await DeliveryChallan.findByPk(id);
    if (!challan) return res.status(404).json({ error: 'Challan not found' });

    // BOLA guard
    if (requestingCompanyId && String(challan.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await DeliveryChallan.destroy({ where: { id } });
    res.json({ message: 'Delivery Challan deleted.' });
  } catch (err) {
    next(err);
  }
};

const nodemailer = require('nodemailer');
const PDFService = require('../../services/PDFService');

exports.sendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingCompanyId = req.body.companyId || req.user?.CompanyId;

    const challan = await DeliveryChallan.findByPk(id, {
        include: [{ model: Ledger, as: 'Customer' }]
    });
    if (!challan) return res.status(404).json({ error: 'Challan not found' });

    // BOLA guard
    if (requestingCompanyId && String(challan.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch company data so the PDF and email show the correct sender details
    const company = await Company.findByPk(challan.CompanyId);
    const companyName = company?.name || 'CalTally';

    const items = await DeliveryChallanItem.findAll({ 
        where: { DeliveryChallanId: id },
        include: [{ model: Item }]
    });

    const { subject, body, toEmail } = req.body;

    const pdfBuffer = await PDFService.generateDeliveryChallan(challan, items, company ? company.toJSON() : {});

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
    const finalToEmail = toEmail || challan.Customer?.email;
    if (!finalToEmail) {
        return res.status(400).json({ error: 'Customer email address missing. Please update the customer ledger.' });
    }

    const mailOptions = {
      from: `"${companyName}" <${fromEmail}>`,
      to: finalToEmail,
      subject: subject || `Delivery Challan ${challan.challanNumber} from ${companyName}`,
      text: body || `Dear ${challan.Customer?.name || 'Customer'},\n\nPlease find attached Delivery Challan ${challan.challanNumber}.\n\nBest regards,\n${companyName} Team`,
      attachments: [{
        filename: `Challan_${challan.challanNumber}.pdf`,
        content: pdfBuffer
      }]
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: `Email sent successfully to ${toEmail}` });

  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
