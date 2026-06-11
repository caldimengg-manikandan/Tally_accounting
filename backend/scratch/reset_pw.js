require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const seq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

(async () => {
  try {
    await seq.authenticate();
    
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Reset passwords for the most likely emails you are using
    const emailsToReset = [
      'admin@tally.com',
      'thej@gmail.com',
      'thejathangavel5@gmail.com',
      'laswathi@gmail.com',
      'thejathangavel05@gmail.com'
    ];

    for (const email of emailsToReset) {
      const [result] = await seq.query(
        `UPDATE "Users" SET password = :hash WHERE email = :email`,
        { replacements: { hash: hashedPassword, email: email } }
      );
      if (result.rowCount > 0) {
        console.log(`✅ Reset password for ${email} to: ${newPassword}`);
      }
    }

    await seq.close();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
