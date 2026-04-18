const { Quote } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const quoteController = require('./backend/modules/sales/quote.controller');

async function test() {
    const req = {
        params: { companyId: '5f028981-8de4-4c19-9a90-54257dd87f70' },
        user: { id: 'dummy', role: 'ADMIN', activeCompanyId: '5f028981-8de4-4c19-9a90-54257dd87f70' }
    };
    const res = {
        json: (data) => console.log("SUCCESS:", Array.isArray(data) ? data.length + " quotes" : data),
        status: (code) => ({ json: (err) => console.log("ERROR (" + code + "):", err) })
    };

    try {
        await quoteController.getQuotes(req, res);
    } catch (err) {
        console.error("FATAL:", err);
    } finally {
        process.exit();
    }
}
test();
