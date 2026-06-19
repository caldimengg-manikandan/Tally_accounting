const jwt = require('jsonwebtoken');
const { User, Ledger, Item } = require('./models');

// Load environment variables
require('dotenv').config();

async function testPost() {
  console.log('Simulating front-end POST request to sales orders API...');
  
  try {
    const user = await User.findOne({ where: { email: 'acchuashh025@gmail.com' } });
    if (!user) {
      console.log('User not found!');
      return;
    }

    const ledger = await Ledger.findOne({ where: { CompanyId: user.CompanyId || null } }) || await Ledger.findOne();
    if (!ledger) {
      console.log('No ledger found!');
      return;
    }

    const item = await Item.findOne({ where: { CompanyId: ledger.CompanyId } }) || await Item.findOne();
    if (!item) {
      console.log('No item found!');
      return;
    }

    // Sign a token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const payload = {
      companyId: ledger.CompanyId,
      customerId: ledger.id,
      orderNumber: 'SO-TEST-' + Date.now(),
      referenceNumber: 'REF-POST',
      date: new Date().toISOString().split('T')[0],
      expectedShipmentDate: '',
      paymentTerms: 'Due on Receipt',
      deliveryMethod: '',
      salesperson: '',
      customerNotes: 'test notes',
      termsConditions: 'test terms',
      subTotal: 2500,
      discount: 0,
      taxPercent: 5,
      taxAmount: 125,
      adjustment: 0,
      totalAmount: 2625,
      status: 'Open',
      projectId: '',
      items: [
        {
          id: Date.now(),
          itemId: item.id,
          detail: item.name,
          quantity: 1,
          rate: 2500,
          amount: 2500
        }
      ]
    };

    console.log('Sending payload to http://localhost:5000/api/sales/orders ...');
    const res = await fetch('http://localhost:5000/api/sales/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-company-id': ledger.CompanyId
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testPost();
