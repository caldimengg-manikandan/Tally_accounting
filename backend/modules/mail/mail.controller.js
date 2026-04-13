const { SystemMail, Company, Ledger, User } = require('../../models');
const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res) => {
  try {
    const { toEmail, subject, body, ledgerId, companyId, type } = req.body;
    const senderId = req.user.id;

    if (!toEmail || !subject || !body || !companyId || !ledgerId) {
      return res.status(400).json({ error: 'Missing required fields (toEmail, subject, body, ledgerId, companyId)' });
    }

    // 1. Configure Transport (Prefer .env, fallback to mock/hardcoded for now)
    // In a real app, these would come from company settings or environment
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER || 'naveenswathi1811@gmail.com',
        pass: process.env.MAIL_PASS || 'your-app-password'
      }
    });

    const fromName = req.user.name || 'Indus CAI';
    const fromEmail = process.env.MAIL_USER || 'naveenswathi1811@gmail.com';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: body,
      // html: body.replace(/\n/g, '<br/>') // Basic HTML conversion if needed
    };

    let mailStatus = 'Sent';
    try {
      // Only attempt to send if credentials are NOT placeholders
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log('Skipping real mail delivery: MAIL_USER/MAIL_PASS not configured in .env');
        console.log('Mail Content:', mailOptions);
      }
    } catch (mailErr) {
      console.error('Nodemailer Error:', mailErr);
      mailStatus = 'Failed';
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
