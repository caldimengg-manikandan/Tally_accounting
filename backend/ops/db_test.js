const { SalesOrder, Ledger, Item, Project } = require('./models');

async function test() {
  try {
    console.log("Testing SalesOrder...");
    await SalesOrder.findAll({ limit: 1 });
    console.log("SalesOrder OK");

    console.log("Testing Ledger...");
    await Ledger.findAll({ limit: 1 });
    console.log("Ledger OK");

    console.log("Testing Item...");
    await Item.findAll({ limit: 1 });
    console.log("Item OK");

    console.log("Testing Project...");
    await Project.findAll({ limit: 1 });
    console.log("Project OK");

  } catch (err) {
    console.log("DB ERROR:", err.message);
  }
  process.exit();
}
test();
