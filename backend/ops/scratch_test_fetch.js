const { FixedAsset, DepreciationLog, Ledger, sequelize } = require('./models');

async function testFetchAssets() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const companyId = '3b17442c-b71b-4211-b04e-125a0e1033c1';
    console.log(`Attempting to find assets for company: ${companyId}`);
    
    const assets = await FixedAsset.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: DepreciationLog },
        { model: Ledger, as: 'AssetLedger', attributes: ['name'] }
      ]
    });

    console.log(`Successfully fetched ${assets.length} assets.`);
  } catch (err) {
    console.error('❌ FETCH ERROR:', err);
  } finally {
    await sequelize.close();
  }
}

testFetchAssets();
