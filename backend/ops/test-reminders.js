const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ReminderService = require('../services/ReminderService');
const { sequelize } = require('../models');

async function testReminders() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Syncing database...');
    await sequelize.sync({ alter: true }); // Ensure new columns and AppNotification are created
    
    console.log('Triggering ReminderService...');
    const result = await ReminderService.processPaymentReminders();
    console.log('Result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testReminders();
