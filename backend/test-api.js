const http = require('http');

http.get('http://127.0.0.1:5000/api/sales-invoices/company/9e2261ae-dd0a-47f9-b14d-5c6fb9dfb505', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
}).on('error', err => console.log('Error:', err.message));
