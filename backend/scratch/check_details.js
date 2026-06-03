const { Company, sequelize } = require('../models');

async function checkDetails() {
  try {
    const cos = await Company.findAll({
      where: { name: 'The Golden Enterprises' }
    });
    cos.forEach(c => {
      console.log(`Company ID: ${c.id}, Name: ${c.name}, GSTIN: ${c.gstNumber}, userId: ${c.userId}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
checkDetails();
