const { Sequelize } = require('sequelize');

const db = new Sequelize(
  'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
  {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: console.log,
  }
);

async function run() {
  try {
    await db.authenticate();
    console.log('✅ Connected to database.');

    // 1. Get existing columns in PurchaseOrders
    const [columns] = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'PurchaseOrders'
    `);
    
    const existingColumns = columns.map(c => c.column_name);
    console.log('Existing columns in PurchaseOrders:', existingColumns);

    // 2. Define fields to ensure they exist
    const fieldsToEnsure = [
      { name: 'CreatedBy', type: 'UUID' },
      { name: 'ModifiedBy', type: 'UUID' },
      { name: 'tdsAmount', type: 'DECIMAL(20, 2) DEFAULT 0' },
      { name: 'tdsRate', type: 'DECIMAL(20, 2) DEFAULT 0' },
      { name: 'tdsName', type: 'VARCHAR(255)' },
      { name: 'reference', type: 'VARCHAR(255)' },
      { name: 'deliveryDate', type: 'DATE' },
      { name: 'paymentTerms', type: 'VARCHAR(255)' },
      { name: 'shipmentPreference', type: 'VARCHAR(255)' },
      { name: 'deliveryAddress', type: 'VARCHAR(255)' },
      { name: 'deliveryAddressText', type: 'TEXT' },
      { name: 'deliveryAddressDataJson', type: 'TEXT' },
      { name: 'itemsJson', type: 'TEXT' },
      { name: 'discount', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
      { name: 'adjustment', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
      { name: 'taxRate', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
      { name: 'discountAmount', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
      { name: 'taxAmount', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
      { name: 'subtotal', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
      { name: 'terms', type: 'TEXT' }
    ];

    // 3. Add missing columns
    for (const field of fieldsToEnsure) {
      if (!existingColumns.includes(field.name)) {
        console.log(`Adding missing column ${field.name}...`);
        await db.query(`ALTER TABLE "PurchaseOrders" ADD COLUMN "${field.name}" ${field.type}`);
        console.log(`✅ Column ${field.name} added successfully.`);
      } else {
        console.log(`Column ${field.name} already exists.`);
      }
    }

    console.log('🎉 Database column check and fix completed!');

  } catch (err) {
    console.error('❌ Error fixing columns:', err);
  } finally {
    await db.close();
  }
}

run();
