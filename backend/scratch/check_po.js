const { Company } = require('../models');

async function check() {
  const cos = await Company.findAll();
  cos.forEach(c => {
    console.log(`Company ID=${c.id}, Name=${c.name}`);
  });
  process.exit(0);
}
check();
