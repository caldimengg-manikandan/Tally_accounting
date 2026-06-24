const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ReminderService = require('../services/ReminderService');
const { sequelize } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    const result = await ReminderService.processPaymentReminders();
    console.log(result);
  } catch (err) {
    console.error("Caught error:", err);
  } finally {
    process.exit(0);
  }
}
test();
