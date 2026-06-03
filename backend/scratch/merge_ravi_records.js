const { 
  Ledger, Transaction, PurchaseOrder, RecurringBill, 
  RecurringExpense, VendorCredit, SalesInvoice, SalesOrder, 
  Quote, RetainerInvoice, sequelize 
} = require('../models');

async function merge() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const sourceIds = [
      '9d19b9c1-cc70-49d4-9c8e-7897270dcf8c', 
      'a52a91ac-5e08-42a3-acdb-f0b96d33ce5e', 
      '3116c99a-8b2c-49de-a4d0-b972f0ba9d13', 
      '8a8dcc21-207d-4814-aa47-12d9aa507ba8', 
      '214f6d79-19f5-416f-a109-c78018017dd9'
    ];
    const targetId = 'f1981bd5-4350-4d6a-9575-7c5667b3e746';

    const targetLedger = await Ledger.findByPk(targetId);
    if (!targetLedger) {
      console.error('Target ledger not found!');
      return;
    }
    console.log(`Target Ledger: "${targetLedger.name}" (ID: ${targetLedger.id})`);

    // Sum up the currentBalances from duplicates to add to target
    let additionalBalance = 0;
    for (const sid of sourceIds) {
      const sourceLedger = await Ledger.findByPk(sid);
      if (sourceLedger) {
        additionalBalance += parseFloat(sourceLedger.currentBalance || 0);
      }
    }
    console.log(`Sum of balances to transfer: ₹${additionalBalance}`);

    // Update Transaction records
    const txUpdated = await Transaction.update(
      { LedgerId: targetId },
      { where: { LedgerId: sourceIds } }
    );
    console.log(`Updated ${txUpdated[0]} Transaction records.`);

    // Update PurchaseOrder records
    const poUpdated = await PurchaseOrder.update(
      { LedgerId: targetId },
      { where: { LedgerId: sourceIds } }
    );
    console.log(`Updated ${poUpdated[0]} PurchaseOrder records.`);

    // Update RecurringBill records
    const rbUpdated = await RecurringBill.update(
      { vendorId: targetId },
      { where: { vendorId: sourceIds } }
    );
    console.log(`Updated ${rbUpdated[0]} RecurringBill records.`);

    // Update RecurringExpense records
    const reUpdated = await RecurringExpense.update(
      { vendorId: targetId },
      { where: { vendorId: sourceIds } }
    );
    console.log(`Updated ${reUpdated[0]} RecurringExpense records.`);

    // Update VendorCredit records
    const vcUpdated = await VendorCredit.update(
      { vendorLedgerId: targetId },
      { where: { vendorLedgerId: sourceIds } }
    );
    console.log(`Updated ${vcUpdated[0]} VendorCredit records.`);

    // Update SalesInvoice records
    const siUpdated = await SalesInvoice.update(
      { customerLedgerId: targetId },
      { where: { customerLedgerId: sourceIds } }
    );
    console.log(`Updated ${siUpdated[0]} SalesInvoice records.`);

    // Update SalesOrder records
    const soUpdated = await SalesOrder.update(
      { LedgerId: targetId },
      { where: { LedgerId: sourceIds } }
    );
    console.log(`Updated ${soUpdated[0]} SalesOrder records.`);

    // Update Quote records
    const qUpdated = await Quote.update(
      { customerLedgerId: targetId },
      { where: { customerLedgerId: sourceIds } }
    );
    console.log(`Updated ${qUpdated[0]} Quote records.`);

    // Update RetainerInvoice records
    const riUpdated = await RetainerInvoice.update(
      { customerLedgerId: targetId },
      { where: { customerLedgerId: sourceIds } }
    );
    console.log(`Updated ${riUpdated[0]} RetainerInvoice records.`);

    // Update target ledger balance
    const finalBalance = (parseFloat(targetLedger.currentBalance || 0) + additionalBalance);
    await targetLedger.update({ currentBalance: finalBalance });
    console.log(`Updated target ledger currentBalance to: ₹${finalBalance}`);

    // Safely delete duplicate ledgers
    const deletedCount = await Ledger.destroy({
      where: { id: sourceIds }
    });
    console.log(`Deleted ${deletedCount} duplicate ledger records.`);

    console.log('\n--- Duplicate Merge Successful! ---');

  } catch (err) {
    console.error('Merge error:', err);
  } finally {
    await sequelize.close();
  }
}

merge();
