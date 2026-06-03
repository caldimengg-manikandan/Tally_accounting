const { getGroups } = require('../modules/accounting/group.controller');
const { User, sequelize } = require('../models');

async function testEndpoint() {
  const companyId = '9c723abd-2d10-4caf-9c1e-dda33b479b48';
  
  // Find a mock user for the request context (the owner of this company)
  const user = await User.findOne({ where: { id: '7af19829-56f3-47e2-840a-686707b8a8b2' } });

  const req = {
    params: { companyId },
    user: { id: user.id, role: user.role, activeCompanyId: companyId }
  };

  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };

  try {
    await getGroups(req, res);
    console.log("Status Code:", res.statusCode);
    if (res.statusCode !== 200) {
      console.log("Error response:", res.data);
    } else {
      console.log("Groups returned:", Array.isArray(res.data) ? res.data.length : "Not an array");
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log("First group sample:", res.data[0]);
      }
    }
  } catch (err) {
    console.error("Endpoint crash:", err);
  } finally {
    await sequelize.close();
  }
}

testEndpoint();
