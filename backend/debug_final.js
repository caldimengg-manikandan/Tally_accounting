const models = require('./models');
const { sequelize } = models;

console.log('--- Model Attribute Audit ---');
Object.keys(sequelize.models).forEach(modelName => {
  const model = sequelize.models[modelName];
  console.log(`Model: ${modelName}`);
  Object.keys(model.rawAttributes).forEach(attrName => {
    const attr = model.rawAttributes[attrName];
    if (attr.unique) {
      console.log(`  - Field: ${attrName} (UNIQUE: ${attr.unique})`);
    }
  });
});

console.log('\n--- Syncing with Logging ---');
sequelize.sync({ force: true, logging: console.log })
  .then(() => console.log('✅ Sync Success'))
  .catch(err => {
    console.error('❌ Sync Failed');
    console.error(err);
    if (err.errors) {
      err.errors.forEach(e => console.error(`  - ${e.message} at ${e.path} value ${e.value}`));
    }
    process.exit(1);
  });
