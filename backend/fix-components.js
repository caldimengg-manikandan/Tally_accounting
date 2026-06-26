const { SalaryComponent, sequelize } = require('./models');

async function fixDuplicates() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    // We will keep track of seen codes per company and delete the rest
    const components = await SalaryComponent.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    const seen = new Set();
    let deletedCount = 0;
    
    for (const comp of components) {
      // For global templates, CompanyId might be null.
      const key = `${comp.CompanyId || 'GLOBAL'}_${comp.code}`;
      if (seen.has(key)) {
        await comp.destroy();
        deletedCount++;
      } else {
        seen.add(key);
      }
    }
    
    console.log(`Deleted ${deletedCount} duplicate salary components.`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

fixDuplicates();
