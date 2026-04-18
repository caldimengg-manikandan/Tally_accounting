const { Ledger, Group } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
    const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70'; // THE MOON ENTERPRISES
    try {
        console.log(`Fetching ledgers for company: ${companyId}`);
        const ledgers = await Ledger.findAll({
            where: { CompanyId: companyId },
            include: [{ model: Group, attributes: ['id', 'name', 'nature'] }],
            order: [['name', 'ASC']]
        });
        console.log(`Found ${ledgers.length} ledgers.`);
        ledgers.forEach(l => {
            console.log(`- ${l.name} (${l.Group?.name || 'No Group'})`);
        });
    } catch (err) {
        console.error("DB Query Error:", err);
    } finally {
        process.exit();
    }
}
check();
