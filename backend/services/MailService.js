const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const userEmail = process.env.SMTP_USER || process.env.MAIL_USER;
const userPass = process.env.SMTP_PASS || process.env.MAIL_PASS;

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

exports.sendMail = async ({ to, subject, html, text }) => {
  if (!userEmail || !userPass) {
    console.warn('⚠️ SMTP credentials not configured. Skipping email send.');
    return { success: false, reason: 'SMTP not configured' };
  }

  const mailOptions = {
    from: `"CalTally Admin" <${userEmail}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''),
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Onboarding email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Nodemailer Error in MailService:', err);
    return { success: false, error: err.message };
  }
};
