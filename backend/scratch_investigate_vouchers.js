const { Sequelize } = require('sequelize');

const db = new Sequelize(
  'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
  { dialect: 'postgres', dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, logging: false }
);

async function run() {
  try {
    await db.authenticate();

    const ids = [
      '9b717b42-a32c-40b9-b1c5-28d18f8793d9',
      '1ce9fc95-1bab-4391-a0db-7311adabcd35'
    ];

    for (const id of ids) {
      console.log('\n' + '='.repeat(70));
      console.log('VOUCHER ID:', id);
      console.log('='.repeat(70));

      const [vRows] = await db.query(
        `SELECT * FROM "Vouchers" WHERE id = $1`,
        { bind: [id] }
      );
      const v = vRows[0];
      if (!v) { console.log('NOT FOUND'); continue; }

      console.log(`Type      : ${v.voucherType}`);
      console.log(`Date      : ${new Date(v.date).toLocaleDateString('en-IN')}`);
      console.log(`Narration : ${v.narration}`);
      console.log(`CompanyId : ${v.CompanyId}`);

      const [txns] = await db.query(
        `SELECT t.id, t.debit, t.credit, t.description,
                l.name as ledger_name
         FROM "Transactions" t
         LEFT JOIN "Ledgers" l ON l.id = t."LedgerId"
         WHERE t."VoucherId" = $1
         ORDER BY t.debit DESC NULLS LAST`,
        { bind: [id] }
      );

      console.log(`\nTransactions (${txns.length} entries):`);
      console.log('  ' + '-'.repeat(65));
      txns.forEach((t, i) => {
        const dr = parseFloat(t.debit || 0).toFixed(2).padStart(12);
        const cr = parseFloat(t.credit || 0).toFixed(2).padStart(12);
        console.log(`  ${i+1}. ${(t.ledger_name || 'UNKNOWN').padEnd(28)} | Dr: ${dr} | Cr: ${cr}`);
        if (t.description) console.log(`       Desc: ${t.description}`);
      });

      const totalDr = txns.reduce((s, t) => s + parseFloat(t.debit || 0), 0);
      const totalCr = txns.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
      const diff = totalDr - totalCr;

      console.log('  ' + '-'.repeat(65));
      console.log(`  TOTAL                              | Dr: ${totalDr.toFixed(2).padStart(12)} | Cr: ${totalCr.toFixed(2).padStart(12)}`);
      console.log(`  DIFFERENCE: ${diff.toFixed(2)} ${Math.abs(diff) < 0.01 ? '✅ BALANCED' : '❌ UNBALANCED'}`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.close();
  }
}

run();
