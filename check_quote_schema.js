const { Quote } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
    try {
        const columns = await Quote.describe();
        console.log("Quote Columns in DB:");
        console.log(Object.keys(columns).join(', '));
    } catch (err) {
        console.error("DB Query Error:", err);
    } finally {
        process.exit();
    }
}
check();
