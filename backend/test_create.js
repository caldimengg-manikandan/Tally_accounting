const { Ledger, sequelize } = require('./models');

async function testCreate() {
  await sequelize.sync({alter: true});
  const ledger = await Ledger.create({
      name: 'Test Customer Details',
      CompanyId: 'b7bcfdc1-b519-459f-8be3-61fc0f06a454', // Fake or omit if nullable
      firstName: 'TestFirst',
      lastName: 'TestLast',
      companyName: 'TestCorp',
      email: 'test@example.com'
  });
  console.log("Created:", ledger.id, ledger.email, ledger.companyName);

  const found = await Ledger.findByPk(ledger.id);
  console.log("Found email:", found.email);

  await Ledger.destroy({where: {id: ledger.id}});
}

testCreate().catch(console.error).finally(()=>process.exit(0));
