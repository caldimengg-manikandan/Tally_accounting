const { SalesInvoice, Ledger, Company } = require('./models');

(async () => {
    try {
        console.log("Testing SalesInvoice.findAll...");
        await SalesInvoice.findAll({
            where: { CompanyId: '9e2261ae-dd0a-47f9-b14d-5c6fb9dfb505' },
            include: [
                { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'currency'] }
            ],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        console.log("SUCCESS!");
    } catch (e) {
        console.error("FAILED!");
        console.error("NAME:", e.name);
        console.error("MESSAGE:", e.message);
        if (e.parent) {
            console.error("PARENT MESSAGE:", e.parent.message);
        }
    }
    process.exit(0);
})();
