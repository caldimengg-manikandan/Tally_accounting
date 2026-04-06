const models = require('./models');
const { sequelize } = models;

async function debugAll() {
  const modelNames = Object.keys(sequelize.models);
  console.log(`Checking ${modelNames.length} models individually...`);

  for (const modelName of modelNames) {
    try {
      console.log(`Syncing model: ${modelName}...`);
      await sequelize.models[modelName].sync({ force: true });
    } catch (err) {
      console.error(`❌ Sync failed for model: ${modelName}`);
      console.error('Error:', err.message);
      if (err.errors) {
        err.errors.forEach(e => console.error(` - Validation Error: ${e.message} on path ${e.path}`));
      }
      process.exit(1);
    }
  }
  
  console.log('All individual models synced. Now syncing entire DB with associations...');
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Entire Database Synced!');
  } catch (err) {
    console.error('❌ Association Sync failed!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugAll();
