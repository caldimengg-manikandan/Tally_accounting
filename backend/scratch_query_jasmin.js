const { User, Company, Voucher, Transaction, Ledger } = require('./models');

async function main() {
    try {
        console.log('--- Querying User jasmin@gmail.com ---');
        const user = await User.findOne({
            where: { email: 'jasmin@gmail.com' },
            include: [{ model: Company }]
        });
        if (!user) {
            console.log('User jasmin@gmail.com not found!');
            return;
        }
        console.log(`User ID: ${user.id}`);
        console.log(`Active Company ID: ${user.activeCompanyId}`);
        console.log('User Companies:');
        for (const c of user.Companies) {
            console.log(`  - Company Name: ${c.name} (ID: ${c.id})`);
        }

        console.log('\n--- Vouchers for Active Company ---');
        const vouchers = await Voucher.findAll({
            where: { CompanyId: user.activeCompanyId },
            include: [{
                model: Transaction,
                include: [{ model: Ledger, attributes: ['name', 'id'] }]
            }]
        });

        console.log(`Total vouchers for active company: ${vouchers.length}`);
        for (const v of vouchers) {
            console.log(`\n[Voucher] ID: ${v.id}, Num: ${v.voucherNumber}, Type: ${v.voucherType}, Status: ${v.status}, Narration: ${v.narration}`);
            for (const t of v.Transactions) {
                console.log(`  - Tx: Ledger: ${t.Ledger?.name} (ID: ${t.LedgerId}), Debit: ${t.debit}, Credit: ${t.credit}, Description: "${t.description}"`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

main().then(() => process.exit());
