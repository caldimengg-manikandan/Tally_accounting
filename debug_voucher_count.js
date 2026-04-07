
const { Voucher, Ledger, Company } = require('./backend/models');

async function debug() {
  try {
    const companies = await Company.findAll();
    if (companies.length === 0) {
      console.log("No companies found.");
      return;
    }

    for (const company of companies) {
      console.log(`\nChecking Company: ${company.name} (${company.id})`);
      
      const lCount = await Ledger.count({ where: { CompanyId: company.id } });
      console.log(`- Ledger count: ${lCount}`);
      
      try {
        const vCount = await Voucher.count({ where: { CompanyId: company.id } });
        console.log(`- Voucher count: ${vCount}`);
      } catch (err) {
        console.error(`- Voucher count FAILED: ${err.message}`);
      }
      
      const vAll = await Voucher.findAll({ where: { CompanyId: company.id } });
      console.log(`- Voucher list length: ${vAll.length}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Debug failed:", err);
    process.exit(1);
  }
}

debug();
