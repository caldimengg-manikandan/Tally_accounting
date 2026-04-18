const { Ledger, Group, sequelize } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const ledgerController = require('./backend/modules/accounting/ledger.controller');

async function test() {
    const req = {
        params: { companyId: '5f028981-8de4-4c19-9a90-54257dd87f70' },
        user: { id: 'dummy', role: 'ADMIN', activeCompanyId: '5f028981-8de4-4c19-9a90-54257dd87f70' }
    };
    const res = {
        json: (data) => console.log("SUCCESS DATA:", data.length, "items"),
        status: (code) => {
            console.log("STATUS CODE:", code);
            return { json: (err) => console.log("ERROR DATA:", err) };
        }
    };

    try {
        await ledgerController.getLedgers(req, res);
    } catch (err) {
        console.error("CRASH:", err);
    } finally {
        process.exit();
    }
}
test();
