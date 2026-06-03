const { getVendors } = require('../modules/purchases/purchases.controller');
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

    await getVendors(req, res);

    console.log('Status Code:', res.statusCode || 200);
    console.log('Number of vendors returned:', res.data ? res.data.length : 'undefined');
    if (res.data) {
      res.data.forEach(v => {
        console.log(`- ID: ${v.id} | Name: "${v.name}" | GroupId: ${v.GroupId}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
