const { sequelize } = require('./models');

async function inspectTable() {
  console.log('Inspecting SalesOrders table columns in DB...');
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'SalesOrders'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns in SalesOrders table:');
    results.forEach(row => {
      console.log(`- ${row.column_name} | Type: ${row.data_type} | Nullable: ${row.is_nullable} | Default: ${row.column_default}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

inspectTable();
