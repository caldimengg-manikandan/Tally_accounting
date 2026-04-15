const { PurchaseOrder, VendorCredit } = require('./models');

async function check() {
  try {
    const pos = await PurchaseOrder.findAll();
    console.log(`\n--- Purchase Orders (${pos.length}) ---`);
    pos.forEach(po => {
      const nullFields = [];
      ['orderNumber', 'date', 'totalAmount'].forEach(f => {
        if (po[f] === null || po[f] === undefined) nullFields.push(f);
      });
      if (nullFields.length > 0) console.log(`PO ID ${po.id} has NULL in: ${nullFields.join(', ')}`);
    });

    const vcs = await VendorCredit.findAll();
    console.log(`\n--- Vendor Credits (${vcs.length}) ---`);
    vcs.forEach(vc => {
      const nullFields = [];
      ['vendorCreditNumber', 'totalAmount', 'CompanyId', 'vendorLedgerId'].forEach(f => {
        if (vc[f] === null || vc[f] === undefined) nullFields.push(f);
      });
      if (nullFields.length > 0) console.log(`VC ID ${vc.id} has NULL in: ${nullFields.join(', ')}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
