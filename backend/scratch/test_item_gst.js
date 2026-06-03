const { Item, sequelize } = require('../models');

async function testItemGST() {
  try {
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connected.');

    // 1. Create a test item with all GST fields
    console.log('Creating test item...');
    const testItem = await Item.create({
      name: 'Resistors Test',
      unit: 'PCS - pcs',
      sellingPrice: 100.00,
      costPrice: 80.00,
      hsnCode: '85340000',
      gstRate: 18,
      itemCode: 'ELEC-TEST-001',
      CompanyId: 'eb78e8e7-232d-43a5-be7f-3ea394c946bc' // Manikandan & Co
    });

    console.log('Test item created successfully:', testItem.toJSON());

    // Assert values
    if (testItem.hsnCode !== '85340000') throw new Error('Assertion failed: hsnCode mismatch');
    if (parseFloat(testItem.gstRate) !== 18) throw new Error('Assertion failed: gstRate mismatch');
    if (testItem.itemCode !== 'ELEC-TEST-001') throw new Error('Assertion failed: itemCode mismatch');

    // 2. Fetch the item and verify
    console.log('Fetching test item by ID...');
    const fetchedItem = await Item.findByPk(testItem.id);
    console.log('Fetched item:', fetchedItem.toJSON());
    if (fetchedItem.hsnCode !== '85340000') throw new Error('Assertion failed on fetch: hsnCode mismatch');

    // 3. Update the item
    console.log('Updating test item...');
    await fetchedItem.update({
      gstRate: 12,
      hsnCode: '85340012'
    });
    console.log('Updated item:', fetchedItem.toJSON());
    if (parseFloat(fetchedItem.gstRate) !== 12) throw new Error('Assertion failed on update: gstRate mismatch');
    if (fetchedItem.hsnCode !== '85340012') throw new Error('Assertion failed on update: hsnCode mismatch');

    // 4. Delete the test item
    console.log('Deleting test item...');
    await fetchedItem.destroy();
    console.log('Test item deleted successfully.');

    console.log('✅ All backend Item GST checks passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testItemGST();
