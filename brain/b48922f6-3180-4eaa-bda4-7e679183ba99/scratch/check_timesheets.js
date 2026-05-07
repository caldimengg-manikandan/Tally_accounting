const path = require('path');
const modelsPath = path.join(process.cwd(), 'backend', 'models');
const { Timesheet } = require(modelsPath);

async function checkTimesheets() {
  try {
    const count = await Timesheet.count();
    const latest = await Timesheet.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
    console.log('Total Timesheets:', count);
    console.log('Latest Timesheets:', JSON.stringify(latest, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTimesheets();
