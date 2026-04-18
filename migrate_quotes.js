const { sequelize } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function migrate() {
    try {
        console.log("Adding customerLedgerId to Quotes table...");
        const queryInterface = sequelize.getQueryInterface();
        await queryInterface.addColumn('Quotes', 'customerLedgerId', {
            type: sequelize.Sequelize.UUID,
            allowNull: true
        });
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        process.exit();
    }
}
migrate();
