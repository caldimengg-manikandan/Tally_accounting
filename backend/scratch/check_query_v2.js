const { Voucher, Transaction, Ledger, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    
    // Simulate the exact query from voucher.controller.js with a valid UUID
    const companyId = '123e4567-e89b-12d3-a456-426614174000'; 
    const vouchers = await Voucher.findAll({
      where: { CompanyId: companyId },
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['id', 'name'] }]
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    
    console.log('Query executed successfully. Results:', vouchers.length);
    process.exit(0);
  } catch (err) {
    console.error('Sequelize Error:', err.message);
    process.exit(1);
  }
}
check();
