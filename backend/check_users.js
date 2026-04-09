const { User, Company } = require('./models');
const fs = require('fs');

async function checkUsers() {
  try {
    const allUsers = await User.findAll({ include: [Company] });
    let output = `TOTAL USERS: ${allUsers.length}\n`;
    allUsers.forEach(u => {
      output += `- User: ${u.email}, Role: ${u.role}, ActiveCompany: ${u.Company?.name} (${u.activeCompanyId})\n`;
    });
    fs.writeFileSync('user_check_results.txt', output);
  } catch (err) {
    fs.writeFileSync('user_check_results.txt', err.stack);
  } finally {
    process.exit();
  }
}

checkUsers();
