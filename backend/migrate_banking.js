const { sequelize } = require('./models');

async function migrate() {
  try {
    console.log('Starting Migration for Banking Fields...');
    
    // Add columns one by one
    const columns = [
      { name: 'accountNumber', type: 'VARCHAR(255)' },
      { name: 'bankName',      type: 'VARCHAR(255)' },
      { name: 'ifsc',          type: 'VARCHAR(255)' },
      { name: 'accountCode',   type: 'VARCHAR(255)' }
    ];

    for (const col of columns) {
      try {
        // Double quote table and column names for Postgres
        await sequelize.query(`ALTER TABLE "Ledgers" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
        console.log(`✅ Column "${col.name}" added successfully.`);
      } catch (err) {
        console.error(`❌ Column "${col.name}" failed: ${err.message}`);
      }
    }

    console.log('Migration Complete.');
    process.exit(0);
  } catch (err) {
    console.error('Critical Migration Failure:', err);
    process.exit(1);
  }
}

migrate();
