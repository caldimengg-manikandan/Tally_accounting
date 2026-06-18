const http = require('http');

const companyId = '1a00dff4-9188-4d78-85bd-9cfb7e54e0bb';
console.log(`Testing getOrders API call for company: ${companyId}`);

http.get(`http://localhost:5000/api/purchases/orders/${companyId}`, (res) => {
  console.log('API Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (Array.isArray(json)) {
        console.log('Orders count:', json.length);
        if (json.length > 0) {
          console.log('First order fields:', Object.keys(json[0]));
          console.log('Order Number:', json[0].orderNumber);
          console.log('Ledger Name:', json[0].Ledger?.name);
        }
      } else {
        console.log('Response is not an array:', json);
      }
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
      console.log('Raw output:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request Error:', err.message);
});
