const path = require('path');
const modelsPath = path.join(process.cwd(), 'backend', 'models');
const { Voucher, PurchaseOrder, VendorCredit, Timesheet, User, Transaction, Ledger } = require(modelsPath);

async function testGetPurchases() {
  try {
    const id = 'b28236c6-87f8-4d93-a5b2-6e735b1e6908';
    
    // Exact logic from project.controller.js
    const vouchers = await Voucher.findAll({
      where: { ProjectId: id },
      include: [
        { 
          model: Transaction, 
          include: [{ model: Ledger, attributes: ['id', 'name'] }] 
        }
      ],
      order: [['date', 'DESC']]
    });

    const orders = await PurchaseOrder.findAll({
      where: { ProjectId: id },
      include: [{ model: Ledger, attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    const credits = await VendorCredit.findAll({
      where: { ProjectId: id },
      include: [{ model: Ledger, as: 'Vendor', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    const timesheets = await Timesheet.findAll({
      where: { ProjectId: id },
      include: [{ model: User, attributes: ['name'] }],
      order: [['date', 'DESC']]
    });

    console.log('Results:');
    console.log('Timesheets count:', timesheets.length);
    console.log('Timesheets:', JSON.stringify(timesheets, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testGetPurchases();
