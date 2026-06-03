const { getLedgers } = require('../modules/accounting/ledger.controller');
const { getCompanyById } = require('../modules/company/company.controller');
const { sequelize, User, Company } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const user = await User.findOne({ where: { email: 'swa@gmail.com' } });
    const companyId = 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'; // Sri Murugan Traders

    const reqLedgers = {
      params: { companyId },
      user: { id: user.id, role: user.role }
    };
    const resLedgers = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; }
    };

    console.log('\n--- TESTING GET LEDGERS ---');
    await getLedgers(reqLedgers, resLedgers);
    console.log('Status:', resLedgers.statusCode || 200);
    console.log('Ledgers returned:', resLedgers.data?.length);

    const reqCompany = {
      params: { id: companyId },
      user: { id: user.id, role: user.role }
    };
    const resCompany = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; }
    };

    console.log('\n--- TESTING GET COMPANY BY ID ---');
    await getCompanyById(reqCompany, resCompany);
    console.log('Status:', resCompany.statusCode || 200);
    console.log('Company Data returned:', resCompany.data ? 'YES' : 'NO');
    if (resCompany.data && resCompany.data.error) {
      console.log('Error from company controller:', resCompany.data.error);
    } else {
      console.log('Company name:', resCompany.data?.name);
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await sequelize.close();
  }
}

test();
