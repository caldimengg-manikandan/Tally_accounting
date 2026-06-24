require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const userEmail = process.env.SMTP_USER || process.env.MAIL_USER;
const userPass = process.env.SMTP_PASS || process.env.MAIL_PASS;

console.log('Using SMTP Host:', smtpHost);
console.log('Using SMTP Port:', smtpPort);
console.log('Using SMTP User:', userEmail);
console.log('Using SMTP Pass length:', userPass ? userPass.length : 0);

if (!userEmail || !userPass) {
  console.error('SMTP credentials are missing!');
  process.exit(1);
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

const mailOptions = {
  from: `"CalTally Test" <${userEmail}>`,
  to: 'calbuy160@gmail.com', // test sending to oneself
  subject: 'Test Email from CalTally Server',
  text: 'This is a test email to verify SMTP credentials.'
};

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('SUCCESS! Message sent:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE! Error details:', err);
    process.exit(1);
  });
