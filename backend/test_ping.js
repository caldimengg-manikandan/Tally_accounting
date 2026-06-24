const axios = require('axios');
axios.get('http://localhost:5000/api/ping').then(r => console.log(r.data)).catch(console.error);
