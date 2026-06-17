require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { sequelize } = require('./models');

async function fixIndexes() {
  console.log('--- DROPPING DUPLICATE SALARY INDEXES ---');
  try {
    // Drop the long-named duplicate index that was created by the migration script
    await sequelize.query(`DROP INDEX IF EXISTS "salary_structure_components__salary_structure_id__salary_compon";`);
    console.log('✅ Dropped old long-name index (if existed)');
    
    // Also drop these in case they are there from previous runs  
    await sequelize.query(`DROP INDEX IF EXISTS "salary_components__company_id_code";`);
    console.log('✅ Dropped old salary_components index (if existed)');
    
    await sequelize.query(`DROP INDEX IF EXISTS "salary_structures__company_id_code";`);
    console.log('✅ Dropped old salary_structures index (if existed)');
    
    // Drop new named indexes in case they exist from previous server boot attempts
    await sequelize.query(`DROP INDEX IF EXISTS "salary_comp_code_unique";`);
    console.log('✅ Dropped salary_comp_code_unique (if existed)');
    
    await sequelize.query(`DROP INDEX IF EXISTS "salary_struct_code_unique";`);
    console.log('✅ Dropped salary_struct_code_unique (if existed)');
    
    await sequelize.query(`DROP INDEX IF EXISTS "salary_struct_comp_unique";`);
    console.log('✅ Dropped salary_struct_comp_unique (if existed)');
    
    console.log('--- ALL DUPLICATE INDEXES REMOVED. Server can now boot cleanly. ---');
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err.message);
    process.exit(1);
  }
}

fixIndexes();
