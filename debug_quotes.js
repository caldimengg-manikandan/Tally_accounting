const { Quote } = require('./backend/models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
    const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70'; // THE MOON ENTERPRISES
    try {
        const quotes = await Quote.findAll({ where: { CompanyId: companyId } });
        console.log(`Found ${quotes.length} quotes for company ${companyId}.`);
        quotes.forEach(q => {
            console.log(`- Quote: ${q.quoteNumber}, Total: ${q.totalAmount}, Status: ${q.status}`);
        });
        
        const allQuotes = await Quote.count();
        console.log(`Total quotes in DB (all companies): ${allQuotes}`);
    } catch (err) {
        console.error("DB Query Error:", err);
    } finally {
        process.exit();
    }
}
check();
