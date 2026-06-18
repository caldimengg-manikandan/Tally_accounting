const { Ledger, Group, Transaction } = require('./models');

async function run() {
  try {
    const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
    const groupName = 'Direct Expenses';
    
    const g = await Group.findOne({ where: { CompanyId: companyId, name: groupName } });
    if (!g) {
      console.log(`Group "${groupName}" not found for company ${companyId}`);
      return;
    }

    // 1. Create Cost of Goods Sold ledger
    let ledger = await Ledger.findOne({ where: { CompanyId: companyId, name: 'Cost of Goods Sold' } });
    if (!ledger) {
      ledger = await Ledger.create({
        name: 'Cost of Goods Sold',
        CompanyId: companyId,
        GroupId: g.id,
        openingBalance: 0,
        openingBalanceType: 'Dr'
      });
      console.log(`Created ledger "Cost of Goods Sold" with ID: ${ledger.id}`);
    } else {
      console.log(`Ledger "Cost of Goods Sold" already exists with ID: ${ledger.id}`);
    }

    // 2. Update the transaction
    const txId = 'b15b3f04-774f-421f-9ec5-b0c3409e85dd';
    const tx = await Transaction.findByPk(txId);
    if (tx) {
      tx.LedgerId = ledger.id;
      await tx.save();
      console.log(`Updated transaction ${txId} to point to Ledger ID: ${ledger.id}`);
    } else {
      console.log(`Transaction ${txId} not found.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
