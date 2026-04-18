const { User, Company } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
    try {
        const users = await User.findAll({ limit: 10 });
        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}), activeCompanyId: ${u.activeCompanyId}`);
        });
    } catch (err) {
        console.error("DB Query Error:", err);
    } finally {
        process.exit();
    }
}
check();
