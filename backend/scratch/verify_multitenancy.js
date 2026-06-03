const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { User, Company, sequelize } = require('../models');
const { createCompany, getCompanies, getCompanyById } = require('../modules/company/company.controller');
const { tenantAccess } = require('../middleware/auth.middleware');

async function runMultiTenancyVerification() {
  console.log("=== Multi-Tenancy Security Validation ===");

  // 1. Create mock users
  console.log("Creating test users...");
  const userA = await User.create({
    name: 'User A',
    email: `usera_${Date.now()}@test.com`,
    password: 'dummy',
    role: 'USER'
  });

  const userB = await User.create({
    name: 'User B',
    email: `userb_${Date.now()}@test.com`,
    password: 'dummy',
    role: 'USER'
  });

  console.log(`Created User A (ID: ${userA.id}) and User B (ID: ${userB.id})`);

  // 2. Create Company A owned by User A
  console.log("Creating Company A under User A...");
  let companyA;
  const mockCreateResA = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { companyA = data; }
  };
  await createCompany({
    body: {
      name: 'Company A - User A Owned',
      baseCurrency: 'INR',
      state: 'Tamil Nadu',
      financialYearStart: new Date().getFullYear() + '-04-01',
    },
    user: { id: userA.id, role: 'USER' }
  }, mockCreateResA);

  console.log(`Company A created successfully (ID: ${companyA.id})`);

  // 3. Create Company B owned by User B
  console.log("Creating Company B under User B...");
  let companyB;
  const mockCreateResB = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { companyB = data; }
  };
  await createCompany({
    body: {
      name: 'Company B - User B Owned',
      baseCurrency: 'INR',
      state: 'Karnataka',
      financialYearStart: new Date().getFullYear() + '-04-01',
    },
    user: { id: userB.id, role: 'USER' }
  }, mockCreateResB);

  console.log(`Company B created successfully (ID: ${companyB.id})`);

  // Helper mock response capturer
  const getMockRes = () => {
    const res = {
      statusCode: 200,
      data: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(d) {
        this.data = d;
      }
    };
    return res;
  };

  // 4. Assert User A ONLY sees Company A
  console.log("\nTesting: Listing companies for User A...");
  const resA = getMockRes();
  await getCompanies({ user: { id: userA.id, role: 'USER' } }, resA);

  const listA = resA.data;
  console.log("User A company list count:", listA.length);
  listA.forEach(c => console.log(`  - Company name: ${c.name}, Owner userId: ${c.userId}`));

  if (listA.length !== 1 || listA[0].id !== companyA.id) {
    throw new Error(`FAIL: User A should only see Company A. List contents: ${JSON.stringify(listA)}`);
  }
  console.log("✅ User A list isolated successfully!");

  // 5. Assert User B ONLY sees Company B
  console.log("\nTesting: Listing companies for User B...");
  const resB = getMockRes();
  await getCompanies({ user: { id: userB.id, role: 'USER' } }, resB);

  const listB = resB.data;
  console.log("User B company list count:", listB.length);
  listB.forEach(c => console.log(`  - Company name: ${c.name}, Owner userId: ${c.userId}`));

  if (listB.length !== 1 || listB[0].id !== companyB.id) {
    throw new Error(`FAIL: User B should only see Company B. List contents: ${JSON.stringify(listB)}`);
  }
  console.log("✅ User B list isolated successfully!");

  // 6. Assert User A cannot access Company B
  console.log("\nTesting: TenantAccess middleware security (User A trying to access Company B)...");
  let nextCalled = false;
  const mockNext = () => { nextCalled = true; };
  const middlewareRes = getMockRes();

  // Mock request representing User A querying Company B
  const mockReq = {
    user: { id: userA.id, role: 'USER' },
    params: { companyId: companyB.id }
  };

  await tenantAccess(mockReq, middlewareRes, mockNext);

  if (nextCalled) {
    throw new Error("FAIL: Middleware allowed User A to access Company B!");
  }

  if (middlewareRes.statusCode !== 403) {
    throw new Error(`FAIL: Expected 403 Forbidden, got ${middlewareRes.statusCode}`);
  }
  console.log(`✅ Middleware successfully blocked User A with status ${middlewareRes.statusCode}: "${middlewareRes.data.error}"`);

  // 7. Assert User A cannot query getCompanyById for Company B
  console.log("\nTesting: Controller security (User A calling getCompanyById for Company B)...");
  const controllerRes = getMockRes();
  await getCompanyById({
    user: { id: userA.id, role: 'USER' },
    params: { id: companyB.id }
  }, controllerRes);

  if (controllerRes.statusCode !== 403) {
    throw new Error(`FAIL: Expected 403 Forbidden, got ${controllerRes.statusCode}`);
  }
  console.log(`✅ Controller successfully blocked User A with status ${controllerRes.statusCode}: "${controllerRes.data.error}"`);

  // 8. Assert User A cannot delete Company B
  console.log("\nTesting: Controller security (User A calling deleteCompany for Company B)...");
  const { deleteCompany } = require('../modules/company/company.controller');
  const deleteRes = getMockRes();
  await deleteCompany({
    user: { id: userA.id, role: 'USER' },
    params: { id: companyB.id }
  }, deleteRes);

  if (deleteRes.statusCode !== 403) {
    throw new Error(`FAIL: Expected 403 Forbidden for delete, got ${deleteRes.statusCode}`);
  }
  console.log(`✅ Controller successfully blocked deletion of Company B by User A with status ${deleteRes.statusCode}: "${deleteRes.data.error}"`);

  // Clean up
  console.log("\nCleaning up test data...");
  await Company.destroy({ where: { id: [companyA.id, companyB.id] } });
  await User.destroy({ where: { id: [userA.id, userB.id] } });

  console.log("=== ALL MULTI-TENANCY VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

runMultiTenancyVerification()
  .then(() => {
    sequelize.close();
    process.exit(0);
  })
  .catch(err => {
    console.error("\n❌ MULTI-TENANCY VERIFICATION FAILED:", err);
    sequelize.close();
    process.exit(1);
  });
