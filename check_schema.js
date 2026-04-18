const { Ledger } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
    try {
        const columns = await Ledger.describe();
        console.log("Ledger Columns in DB:");
        console.log(Object.keys(columns).join(', '));
        
        if (!columns.deletedAt) {
            console.log("WARNING: deletedAt column IS MISSING! This will break paranoid models.");
        }
    } catch (err) {
        console.error("DB Query Error:", err);
    } finally {
        process.exit();
    }
}
check();
