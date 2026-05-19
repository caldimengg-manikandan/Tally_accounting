const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const sequelize = new Sequelize(process.env.DATABASE_URL.replace(/(dpg-[a-z0-9-]+)(\/)/, '$1.singapore-postgres.render.com$2'), { dialect: 'postgres' });

async function run() {
    const [results, metadata] = await sequelize.query("SELECT * FROM \"Transactions\" WHERE description LIKE '%BILL_REF%' ORDER BY \"createdAt\" DESC LIMIT 5");
    console.log(results.map(r => ({id: r.id, desc: r.description, voucherId: r.VoucherId})));
}
run();
