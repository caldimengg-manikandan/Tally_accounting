const { getEmployees } = require('./modules/payroll/payroll.controller');

async function test() {
  const req = {
    params: { companyId: 'YOUR_UUID' },
    query: { limit: 1000 },
    user: { role: 'ADMIN' }
  };
  const { Company } = require('./models');
  const company = await Company.findOne();
  if (!company) { console.log('no company'); return; }
  
  req.params.companyId = company.id;
  req.companyId = company.id;
  const res = {
    json: (data) => console.log('JSON Response:', data?.employees?.length),
    status: (code) => ({ json: (data) => console.log('Error', code, data) })
  };
  
  await getEmployees(req, res);
  process.exit(0);
}
test();
