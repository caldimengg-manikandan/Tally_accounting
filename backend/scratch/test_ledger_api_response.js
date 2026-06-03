const { getLedgers } = require('../modules/accounting/ledger.controller');
const { sequelize } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    const req = {
      params: { companyId: 'eb78e8e7-232d-43a5-be7f-3ea394c946bc' }
    };
    const res = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; }
    };

    await getLedgers(req, res);

    console.log('Status Code:', res.statusCode || 200);
    console.log('Number of ledgers returned:', res.data.length);
    
    // Print details of ledgers returned
    res.data.forEach(l => {
      const json = l.toJSON ? l.toJSON() : l;
      console.log(`- ID: ${json.id} | Name: "${json.name}" | GroupName: "${json.groupName}" | Group Object:`, json.Group);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
