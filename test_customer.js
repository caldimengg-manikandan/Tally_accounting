const { Ledger, Group, sequelize } = require('./backend/models');

async function testCreate() {
  try {
    // Find or create a company
    const companyId = '00000000-0000-0000-0000-000000000001'; // Mock or any uuid
    
    // Attempt creation with exact payload from frontend
    const payload = {
      name: 'lokesh K',
      salutation: 'Mr.',
      firstName: 'lokesh',
      lastName: 'K',
      customerType: 'Business',
      companyName: 'calidir',
      email: 'lokeshwari5@gmail.com',
      workPhone: '0800332539',
      mobile: '',
      website: '',
      pan: 'ABCDE1234F',
      gstNumber: '22AAAAA0000A1Z5',
      companyId: companyId,
      groupName: 'Sundry Debtors',
      billingAddress: JSON.stringify({"attention":"","country":"India","street1":"RM RM","street2":"Street 2","city":"","state":"Tamil Nadu","pinCode":"","phone":""}),
      shippingAddress: JSON.stringify({"attention":"","country":"India","street1":"RM RM","street2":"Street 2","city":"","state":"Tamil Nadu","pinCode":"","phone":""}),
      currency: 'USD - US Dollar',
      paymentTerms: 'Due on Receipt',
      receivableAccount: 'Accounts Receivable',
      openingBalance: 0,
      portalEnabled: false,
      displayName: 'lokesh K',
      GroupId: '00000000-0000-0000-0000-000000000002', // dummy
      CompanyId: companyId
    };

    const ledger = await Ledger.build(payload);
    await ledger.validate();
    console.log('Validation successful!');
  } catch (err) {
    console.log('VALIDATION ERROR:', err.message);
  } finally {
    process.exit(0);
  }
}

testCreate();
