const { Sequelize } = require('sequelize');

const db = new Sequelize(
  'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
  {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false,
  }
);

async function run() {
  try {
    await db.authenticate();
    console.log('✅ DB Connected!\n');

    // 1. Row counts for key tables
    console.log('📊 Row Counts:');
    const keyTables = ['Companies', 'Users', 'Ledgers', 'Groups', 'Vouchers', 'Transactions', 'Items', 'SalesInvoices', 'SalesOrders', 'PurchaseOrders', 'Quotes'];
    for (const tbl of keyTables) {
      try {
        const [[row]] = await db.query(`SELECT COUNT(*) as cnt FROM "${tbl}"`);
        console.log(`  ${tbl}: ${row.cnt} rows`);
      } catch (e) {
        console.log(`  ${tbl}: ❌ error - ${e.message}`);
      }
    }

    // 2. Double-entry check (debit = credit per voucher)
    console.log('\n⚖️  Double-Entry Balance Check:');
    const [unbalanced] = await db.query(`
      SELECT "VoucherId", 
             ROUND(SUM(debit)::numeric, 2) as total_debit,
             ROUND(SUM(credit)::numeric, 2) as total_credit,
             ROUND((SUM(debit) - SUM(credit))::numeric, 2) as diff
      FROM "Transactions"
      GROUP BY "VoucherId"
      HAVING ABS(SUM(debit) - SUM(credit)) > 0.01
      LIMIT 10
    `);
    if (unbalanced.length === 0) {
      console.log('  ✅ All vouchers are balanced! (debit = credit)');
    } else {
      console.log(`  ❌ ${unbalanced.length} unbalanced vouchers found:`);
      unbalanced.forEach(r =>
        console.log(`     VoucherId=${r.VoucherId} | Debit=${r.total_debit} | Credit=${r.total_credit} | Diff=${r.diff}`)
      );
    }

    // 3. Total debit vs credit across all transactions
    console.log('\n📈 Overall Debit vs Credit:');
    const [[totals]] = await db.query(`
      SELECT 
        ROUND(SUM(debit)::numeric, 2) as total_debit,
        ROUND(SUM(credit)::numeric, 2) as total_credit,
        ROUND((SUM(debit) - SUM(credit))::numeric, 2) as diff
      FROM "Transactions"
    `);
    console.log(`  Total Debit:  ${totals.total_debit}`);
    console.log(`  Total Credit: ${totals.total_credit}`);
    console.log(`  Difference:   ${Math.abs(totals.diff) < 0.01 ? '✅ ' : '❌ '}${totals.diff}`);

    // 4. Orphan checks
    console.log('\n🔍 Orphan Record Checks:');
    const [[orphanTx]] = await db.query(`
      SELECT COUNT(*) as cnt FROM "Transactions" t
      LEFT JOIN "Vouchers" v ON t."VoucherId" = v.id
      WHERE v.id IS NULL
    `);
    console.log(`  Transactions without Voucher: ${orphanTx.cnt === '0' ? '✅ 0' : '❌ ' + orphanTx.cnt}`);

    const [[orphanLedger]] = await db.query(`
      SELECT COUNT(*) as cnt FROM "Transactions" t
      LEFT JOIN "Ledgers" l ON t."LedgerId" = l.id
      WHERE l.id IS NULL
    `);
    console.log(`  Transactions without Ledger:  ${orphanLedger.cnt === '0' ? '✅ 0' : '❌ ' + orphanLedger.cnt}`);

    const [[orphanGroup]] = await db.query(`
      SELECT COUNT(*) as cnt FROM "Ledgers" l
      LEFT JOIN "Groups" g ON l."GroupId" = g.id
      WHERE g.id IS NULL
    `);
    console.log(`  Ledgers without Group:        ${orphanGroup.cnt === '0' ? '✅ 0' : '❌ ' + orphanGroup.cnt}`);

    // 5. Recent vouchers
    console.log('\n🕐 Last 5 Vouchers:');
    const [recent] = await db.query(`
      SELECT v.id, v."voucherType", v.date, v.narration, v."createdAt",
             COUNT(t.id) as tx_count,
             ROUND(SUM(t.debit)::numeric,2) as debit,
             ROUND(SUM(t.credit)::numeric,2) as credit
      FROM "Vouchers" v
      LEFT JOIN "Transactions" t ON t."VoucherId" = v.id
      GROUP BY v.id, v."voucherType", v.date, v.narration, v."createdAt"
      ORDER BY v."createdAt" DESC
      LIMIT 5
    `);
    recent.forEach(v =>
      console.log(`  [${v.voucherType}] Date:${v.date} | Txns:${v.tx_count} | Dr:${v.debit} Cr:${v.credit} | ${v.narration || '(no narration)'}`)
    );

    // 6. Ledger balances
    console.log('\n💰 Top 10 Ledgers by Balance:');
    const [balances] = await db.query(`
      SELECT l.name, 
             ROUND(SUM(t.debit)::numeric, 2) as total_debit,
             ROUND(SUM(t.credit)::numeric, 2) as total_credit,
             ROUND((SUM(t.debit) - SUM(t.credit))::numeric, 2) as balance
      FROM "Ledgers" l
      LEFT JOIN "Transactions" t ON t."LedgerId" = l.id
      GROUP BY l.id, l.name
      ORDER BY ABS(SUM(COALESCE(t.debit,0)) - SUM(COALESCE(t.credit,0))) DESC
      LIMIT 10
    `);
    balances.forEach(b =>
      console.log(`  ${b.name.padEnd(30)} | Dr:${(b.total_debit||0).toString().padStart(12)} | Cr:${(b.total_credit||0).toString().padStart(12)} | Balance:${b.balance||0}`)
    );

    // 7. Companies overview
    console.log('\n🏢 Companies in DB:');
    const [companies] = await db.query(`SELECT id, name, "createdAt" FROM "Companies"`);
    companies.forEach(c => console.log(`  [${c.id}] ${c.name}`));

    // 8. Users overview
    console.log('\n👤 Users in DB:');
    const [users] = await db.query(`SELECT id, name, email, role, "createdAt" FROM "Users"`);
    users.forEach(u => console.log(`  ${u.name} (${u.email}) - ${u.role}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await db.close();
  }
}

run();
