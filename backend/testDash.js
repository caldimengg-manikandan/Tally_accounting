const http = require('http');
http.get('http://127.0.0.1:5000/api/reports/dashboard/d6c827cd-ebcf-4545-a764-a63442a8b941', {
  headers: {
    // We don't have token, so we just run auth bypass or check if it throws 500
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
