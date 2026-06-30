const { Ledger, FixedAsset, Transaction, sequelize } = require('../models');

async function cleanupDepreciationLedgers() {
  const t = await sequelize.transaction();
  try {
    console.log('Finding all Depreciation Expense ledgers...');
    const ledgers = await Ledger.findAll({
      where: { name: 'Depreciation Expense' },
      order: [['createdAt', 'ASC']],
      transaction: t
    });

    if (ledgers.length <= 1) {
      console.log(`Found ${ledgers.length} ledgers. Nothing to clean up.`);
      await t.rollback();
      return;
    }

    const masterLedger = ledgers[0];
    const duplicateLedgers = ledgers.slice(1);

    console.log(`Master Ledger ID: ${masterLedger.id} | Balance: ${masterLedger.currentBalance}`);
    console.log(`Found ${duplicateLedgers.length} duplicate ledgers to merge and delete.`);

    let totalMergedBalance = parseFloat(masterLedger.currentBalance || 0);

    for (const dup of duplicateLedgers) {
      console.log(`Merging Duplicate ID: ${dup.id} | Balance: ${dup.currentBalance}`);
      totalMergedBalance += parseFloat(dup.currentBalance || 0);

      // 1. Update Fixed Assets
      const [updatedAssets] = await FixedAsset.update(
        { depreciationLedgerId: masterLedger.id },
        { where: { depreciationLedgerId: dup.id }, transaction: t }
      );
      console.log(`  - Updated ${updatedAssets} Fixed Assets.`);

      // 2. Update Transaction Lines
      const [updatedTx] = await Transaction.update(
        { ledgerId: masterLedger.id },
        { where: { ledgerId: dup.id }, transaction: t }
      );
      console.log(`  - Updated ${updatedTx} Transaction lines.`);

      // 3. Delete the duplicate ledger
      await dup.destroy({ transaction: t });
      console.log(`  - Deleted Ledger ${dup.id}.`);
    }

    // Update master balance
    await masterLedger.update({ currentBalance: totalMergedBalance }, { transaction: t });
    console.log(`Master Ledger updated with combined balance: ${totalMergedBalance}`);

    await t.commit();
    console.log('Cleanup completed successfully!');
  } catch (err) {
    await t.rollback();
    console.error('Error during cleanup:', err);
  } finally {
    process.exit(0);
  }
}

cleanupDepreciationLedgers();
