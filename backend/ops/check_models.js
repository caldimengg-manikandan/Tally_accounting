try {
  const models = require('../models/index.js');
  console.log('Models loaded successfully');
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
