const { Transaction, Voucher, Ledger, sequelize } = require('../models');

async function clean() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const vendorId = 'f1981bd5-4350-4d6a-9575-7c5667b3e746';

    // 1. Find all transaction lines associated with this vendor
    const txs = await Transaction.findAll({
      where: { LedgerId: vendorId },
      raw: true
    });

    const voucherIds = [...new Set(txs.map(t => t.VoucherId).filter(Boolean))];
    console.log(`Found ${txs.length} transaction lines belonging to ${voucherIds.length} unique vouchers.`);

    if (voucherIds.length > 0) {
      // 2. Delete the vouchers (will cascade delete all transaction lines)
      const deletedVouchers = await Voucher.destroy({
        where: { id: voucherIds }
      });
      console.log(`Deleted ${deletedVouchers} test vouchers completely.`);
    }

    // 3. Reset the vendor ledger balance
    const vendor = await Ledger.findByPk(vendorId);
    if (vendor) {
      await vendor.update({
        currentBalance: 0,
        openingBalance: 0
      });
      console.log(`Reset balance for vendor "${vendor.name}" to ₹0.`);
    }

    console.log('\n--- Vendor cleanup completed successfully! ---');

  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await sequelize.close();
  }
}

clean();
