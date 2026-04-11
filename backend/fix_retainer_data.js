const { RetainerInvoice, Ledger, sequelize } = require('./models');

async function fixRetainerData() {
  try {
    // 1. Alter table if column missing (Sequelize alt)
    await sequelize.query('ALTER TABLE "RetainerInvoices" ADD COLUMN IF NOT EXISTS "customerLedgerId" UUID;');
    
    // 2. Backfill
    const retainers = await RetainerInvoice.findAll({ where: { customerLedgerId: null } });
    console.log(`Fixing ${retainers.length} retainers...`);
    
    for (const ret of retainers) {
      const ledger = await Ledger.findOne({ 
        where: { 
          name: ret.customerName,
          CompanyId: ret.CompanyId 
        } 
      });
      
      if (ledger) {
        await ret.update({ customerLedgerId: ledger.id });
        console.log(`Linked RET: ${ret.invoiceNumber} to Ledger: ${ledger.name}`);
      } else {
        console.warn(`Could not find ledger for ${ret.customerName} in company ${ret.CompanyId}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fixRetainerData();
