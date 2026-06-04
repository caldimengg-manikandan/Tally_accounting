const { sequelize } = require('../models');

console.log('Registered Sequelize Models:', Object.keys(sequelize.models));
sequelize.close();
