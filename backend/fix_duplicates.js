const { Sequelize } = require('sequelize');
require('dotenv').config({path: __dirname + '/.env'});
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function run() {
  try {
    const t = await sequelize.transaction();
    // 1. Update invoice to link to latest sales voucher
    await sequelize.query(`UPDATE "SalesInvoices" SET "VoucherId" = '73943b1f-9aec-4216-80d5-05fc59e4fe02' WHERE id = 'e3f23626-0894-4023-b54b-94cb6396e766'`, { transaction: t });
    
    // 2. Delete the 5 duplicate vouchers
    const duplicateIds = [
      'c698a263-2b5f-4a22-8a4c-ccc3086e11d3',
      'b72df0fc-2e9c-4a56-9755-678755b063c4',
      '66eb13ec-3e0e-468d-93ea-439bbd05650a',
      'e668edcb-2ff3-4d83-b6d0-460a7c6fb4e2',
      '877830cc-910f-4f8b-8317-d231e288caf5'
    ];
    
    for (const id of duplicateIds) {
      await sequelize.query(`DELETE FROM "Transactions" WHERE "VoucherId" = :id`, { replacements: { id }, transaction: t });
      await sequelize.query(`DELETE FROM "Vouchers" WHERE id = :id`, { replacements: { id }, transaction: t });
    }
    
    // 3. Recalculate Ledger balance for Apex Tech Solutions
    // Find ledger ID
    const [ledgers] = await sequelize.query(`SELECT id FROM "Ledgers" WHERE name LIKE '%Apex%'`, { transaction: t });
    if (ledgers.length > 0) {
      const ledgerId = ledgers[0].id;
      // Get all transactions for this ledger
      const [txs] = await sequelize.query(`SELECT debit, credit FROM "Transactions" WHERE "LedgerId" = :ledgerId`, { replacements: { ledgerId }, transaction: t });
      
      let balance = 0;
      for (const tx of txs) {
        // Debtors have Dr normal balance. Balance = opening + debit - credit.
        balance += parseFloat(tx.debit || 0) - parseFloat(tx.credit || 0);
      }
      // Update ledger
      await sequelize.query(`UPDATE "Ledgers" SET "currentBalance" = :balance WHERE id = :ledgerId`, { replacements: { balance, ledgerId }, transaction: t });
      console.log('Updated ledger balance to', balance);
    }
    
    // Also recalculate the Sales account balance
    const [salesLedgers] = await sequelize.query(`SELECT id FROM "Ledgers" WHERE name = 'Sales' AND "CompanyId" = 'ddd9f764-bd93-4cb0-bd3f-800be42b42b0'`, { transaction: t });
    if (salesLedgers.length > 0) {
      const sLedgerId = salesLedgers[0].id;
      const [txs] = await sequelize.query(`SELECT debit, credit FROM "Transactions" WHERE "LedgerId" = :sLedgerId`, { replacements: { sLedgerId }, transaction: t });
      let balance = 0;
      for (const tx of txs) {
        // Sales is Income, Cr normal balance. Balance = opening + credit - debit
        balance += parseFloat(tx.credit || 0) - parseFloat(tx.debit || 0);
      }
      await sequelize.query(`UPDATE "Ledgers" SET "currentBalance" = :balance WHERE id = :sLedgerId`, { replacements: { balance, sLedgerId }, transaction: t });
      console.log('Updated Sales ledger balance to', balance);
    }

    await t.commit();
    console.log('Fix complete!');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
