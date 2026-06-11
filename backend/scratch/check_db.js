require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

(async () => {
  try {
    await seq.authenticate();
    console.log('✅ Connected to PostgreSQL database successfully!\n');

    // List all tables
    const [tables] = await seq.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('📋 Tables in your database:');
    tables.forEach(t => console.log('  -', t.table_name));

    // Counts
    const [vc] = await seq.query('SELECT COUNT(*) as cnt FROM "Vouchers"');
    const [ld] = await seq.query('SELECT COUNT(*) as cnt FROM "Ledgers"');
    const [co] = await seq.query('SELECT COUNT(*) as cnt FROM "Companies"');
    const [tx] = await seq.query('SELECT COUNT(*) as cnt FROM "Transactions"');
    const [po] = await seq.query('SELECT COUNT(*) as cnt FROM "PurchaseOrders"');

    console.log('\n📊 Record Counts:');
    console.log('  Companies   :', co[0].cnt);
    console.log('  Ledgers     :', ld[0].cnt);
    console.log('  Vouchers    :', vc[0].cnt);
    console.log('  Transactions:', tx[0].cnt);
    console.log('  PurchaseOrders:', po[0].cnt);

    // Last 5 Bills (Purchase vouchers)
    const [bills] = await seq.query(
      `SELECT v."voucherNumber", v."status", v."date", length(v."narration") as narr_len
       FROM "Vouchers" v WHERE v."voucherType" = 'Purchase' ORDER BY v."date" DESC LIMIT 10`
    );
    console.log('\n🧾 Last 10 Bills saved:');
    if (bills.length === 0) {
      console.log('  ❌ No Purchase bills found!');
    } else {
      bills.forEach(b => console.log(`  - ${b.voucherNumber} | status: ${b.status} | date: ${new Date(b.date).toLocaleDateString('en-IN')} | narration bytes: ${b.narr_len}`));
    }

    // Last 5 Ledgers (Vendors)
    const [vendors] = await seq.query(
      `SELECT l."name", l."billingAddress", l."email", l."phone", l."gstNumber"
       FROM "Ledgers" l
       INNER JOIN "Groups" g ON l."GroupId" = g.id
       WHERE g.name IN ('Sundry Creditors', 'Accounts Payable', 'Creditors', 'Sundry Creditors (Payable)')
       LIMIT 10`
    );
    console.log('\n🏢 Vendors (Creditor Ledgers):');
    if (vendors.length === 0) {
      console.log('  ❌ No vendor ledgers found!');
    } else {
      vendors.forEach(v => console.log(`  - ${v.name} | address: ${v.billingAddress ? 'YES' : 'EMPTY'} | email: ${v.email || 'none'} | GST: ${v.gstNumber || 'none'}`));
    }

    await seq.close();
  } catch (e) {
    console.error('❌ DB Error:', e.message);
    process.exit(1);
  }
})();
