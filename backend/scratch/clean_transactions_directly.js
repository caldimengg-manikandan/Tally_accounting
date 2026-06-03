const { Transaction, Ledger, sequelize } = require('../models');

async function cleanDirect() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const vendorId = 'f1981bd5-4350-4d6a-9575-7c5667b3e746';

    // Delete transaction lines directly
    const deletedCount = await Transaction.destroy({
      where: { LedgerId: vendorId }
    });
    console.log(`Deleted ${deletedCount} transaction lines directly.`);

    // Reset balance
    const vendor = await Ledger.findByPk(vendorId);
    if (vendor) {
      await vendor.update({
        currentBalance: 0,
        openingBalance: 0
      });
      console.log(`Successfully reset balance for vendor "${vendor.name}" to ₹0.`);
    }

  } catch (err) {
    console.error('Error during direct clean:', err);
  } finally {
    await sequelize.close();
  }
}

cleanDirect();
