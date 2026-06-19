const { Ledger, Group, Transaction, Voucher, Company } = require('./models');
const reportsController = require('./modules/reports/reports.controller');

async function run() {
  try {
    const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';

    // Mock Express req/res
    const req = { params: { companyId } };
    const res = {
      json: (data) => {
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log(`STATUS CODE: ${code}`);
        return res;
      }
    };

    console.log('\n--- GET TRIAL BALANCE ---');
    await reportsController.getTrialBalance(req, res);

    console.log('\n--- GET PROFIT & LOSS ---');
    await reportsController.getProfitAndLoss(req, res);

    console.log('\n--- GET BALANCE SHEET ---');
    await reportsController.getBalanceSheet(req, res);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
