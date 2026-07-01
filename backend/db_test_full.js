const { SalesOrder, Ledger, SalesOrderItem, Item, Project } = require('./models');

async function test() {
  const companyId = '00000000-0000-0000-0000-000000000000';
  try {
    console.log("Testing SalesOrder getOrders query...");
    await SalesOrder.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'currency'] },
        { model: SalesOrderItem, as: 'Items' }
      ]
    });
    console.log("SalesOrder OK");
  } catch (err) {
    console.log("SalesOrder ERROR:", err.message);
  }

  try {
    console.log("Testing Ledger getByCompany query...");
    await Ledger.findAll({ where: { CompanyId: companyId } });
    console.log("Ledger OK");
  } catch (err) {
    console.log("Ledger ERROR:", err.message);
  }

  try {
    console.log("Testing Item getByCompany query...");
    await Item.findAll({ where: { CompanyId: companyId } });
    console.log("Item OK");
  } catch (err) {
    console.log("Item ERROR:", err.message);
  }
  
  try {
    console.log("Testing Project getByCompany query...");
    await Project.findAll({ where: { CompanyId: companyId } });
    console.log("Project OK");
  } catch (err) {
    console.log("Project ERROR:", err.message);
  }

  process.exit();
}
test();
