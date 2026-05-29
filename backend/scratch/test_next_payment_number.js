const { getNextPaymentNumber } = require('../modules/purchases/paymentMade.controller');
const { sequelize } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');

    const req = {
      params: {
        companyId: '7d782f6b-d412-4fa4-8eb9-1079ec70ac10'
      }
    };

    const res = {
      json: (data) => {
        console.log('API Response data:', data);
        if (data.nextNumber === 10) {
          console.log('SUCCESS: nextNumber is correctly calculated as 10!');
        } else {
          console.log(`FAILURE: Expected nextNumber 10, got ${data.nextNumber}`);
        }
      },
      status: (code) => {
        console.log('Status code:', code);
        return res;
      }
    };

    
    await getNextPaymentNumber(req, res);
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

test();
