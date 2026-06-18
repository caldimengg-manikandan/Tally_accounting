const { Sequelize } = require('sequelize');

const db = new Sequelize(
  'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
  { dialect: 'postgres', dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, logging: false }
);

/**
 * VOUCHER 1: 9b717b42 — Purchase ₹11,800 (Resistors + Capacitors, IGST 18%)
 *
 * Problem: IGST ₹1800 was recorded AND THEN split into CGST/SGST ₹900+₹900
 *          This double-counts the tax. Debit = ₹13,600 but Credit = ₹11,800.
 *
 * This is an IGST purchase (inter-state), so we should keep ONLY the IGST entry
 * and DELETE the duplicate CGST + SGST rows.
 *
 * Fix: Delete the CGST ₹900 and SGST ₹900 rows → Debit becomes ₹11,800 ✅
 *
 * ─────────────────────────────────────────────────────────────
 *
 * VOUCHER 2: 1ce9fc95 — Purchase ₹8,260 (Resistors + Capacitors, IGST 18%)
 *
 * Problem: Contains BOTH:
 *   - Its own correct entries (Purchase ₹7,000 + IGST ₹1,260 + Kumar Components Cr ₹8,260)
 *   - Leaked entries from Voucher 1 (Purchase ₹10,000 + IGST ₹1,800 + Kumar Cr ₹11,800)
 *   - Also has CGST/SGST split ₹630+₹630 that shouldn't exist
 *
 * Fix:
 *   - Delete the leaked rows: Purchase ₹10,000, IGST ₹1,800, Kumar Cr ₹11,800
 *   - Delete the erroneous CGST ₹630 and SGST ₹630 split rows
 *   Result → Purchase ₹7,000 + IGST ₹1,260 vs Kumar ₹8,260 ✅ (7000+1260=8260)
 */

async function fix() {
  const t = await db.transaction();
  try {
    console.log('🔍 Starting DB fix with transaction (safe — will rollback on error)\n');

    // ── FIX VOUCHER 1 ────────────────────────────────────────────────────────
    const v1 = '9b717b42-a32c-40b9-b1c5-28d18f8793d9';
    console.log('--- Fixing Voucher 1 (Purchase ₹11,800) ---');

    // Find the CGST and SGST rows (debit 900 each) to delete
    const [v1Rows] = await db.query(
      `SELECT id, debit, credit, description FROM "Transactions" WHERE "VoucherId" = $1`,
      { bind: [v1], transaction: t }
    );
    console.log('Current rows:');
    v1Rows.forEach(r => console.log(`  id=${r.id} Dr=${r.debit} Cr=${r.credit} desc=${r.description}`));

    const v1ToDelete = v1Rows.filter(r =>
      (parseFloat(r.debit) === 900 && r.description && (r.description.includes('CGST') || r.description.includes('SGST')))
    );
    console.log(`\nRows to DELETE (CGST/SGST ₹900 duplicates):`);
    v1ToDelete.forEach(r => console.log(`  id=${r.id} Dr=${r.debit} desc=${r.description}`));

    if (v1ToDelete.length !== 2) {
      throw new Error(`Expected 2 rows to delete for Voucher 1, found ${v1ToDelete.length}. Aborting.`);
    }

    for (const row of v1ToDelete) {
      await db.query(`DELETE FROM "Transactions" WHERE id = $1`, { bind: [row.id], transaction: t });
    }
    console.log('✅ Voucher 1 fixed — deleted CGST+SGST duplicate rows\n');

    // ── FIX VOUCHER 2 ────────────────────────────────────────────────────────
    const v2 = '1ce9fc95-1bab-4391-a0db-7311adabcd35';
    console.log('--- Fixing Voucher 2 (Purchase ₹8,260) ---');

    const [v2Rows] = await db.query(
      `SELECT id, debit, credit, description FROM "Transactions" WHERE "VoucherId" = $1 ORDER BY debit DESC NULLS LAST`,
      { bind: [v2], transaction: t }
    );
    console.log('Current rows:');
    v2Rows.forEach(r => console.log(`  id=${r.id} Dr=${r.debit} Cr=${r.credit} desc=${r.description}`));

    // Delete: the leaked Purchase ₹10,000, leaked IGST ₹1,800, leaked Kumar Cr ₹11,800
    // AND the wrong CGST ₹630, SGST ₹630
    const v2ToDelete = v2Rows.filter(r => {
      const dr = parseFloat(r.debit || 0);
      const cr = parseFloat(r.credit || 0);
      if (dr === 10000) return true;     // leaked Purchase from voucher 1
      if (dr === 1800) return true;      // leaked IGST from voucher 1
      if (cr === 11800) return true;     // leaked Kumar credit from voucher 1
      if (dr === 630 && r.description && (r.description.includes('CGST') || r.description.includes('SGST'))) return true;
      return false;
    });

    console.log(`\nRows to DELETE (leaked + erroneous entries):`);
    v2ToDelete.forEach(r => console.log(`  id=${r.id} Dr=${r.debit} Cr=${r.credit} desc=${r.description}`));

    if (v2ToDelete.length !== 5) {
      throw new Error(`Expected 5 rows to delete for Voucher 2, found ${v2ToDelete.length}. Aborting.`);
    }

    for (const row of v2ToDelete) {
      await db.query(`DELETE FROM "Transactions" WHERE id = $1`, { bind: [row.id], transaction: t });
    }
    console.log('✅ Voucher 2 fixed — deleted leaked + CGST/SGST erroneous rows\n');

    // ── VERIFY ───────────────────────────────────────────────────────────────
    console.log('--- Verification ---');
    for (const [label, vid] of [['Voucher 1', v1], ['Voucher 2', v2]]) {
      const [rows] = await db.query(
        `SELECT debit, credit FROM "Transactions" WHERE "VoucherId" = $1`,
        { bind: [vid], transaction: t }
      );
      const totalDr = rows.reduce((s, r) => s + parseFloat(r.debit || 0), 0);
      const totalCr = rows.reduce((s, r) => s + parseFloat(r.credit || 0), 0);
      const diff = Math.abs(totalDr - totalCr);
      console.log(`  ${label}: Dr=${totalDr.toFixed(2)} Cr=${totalCr.toFixed(2)} ${diff < 0.01 ? '✅ BALANCED' : '❌ STILL UNBALANCED diff=' + diff}`);
    }

    await t.commit();
    console.log('\n✅ All changes COMMITTED to database!');

  } catch (err) {
    await t.rollback();
    console.error('\n❌ ERROR — all changes ROLLED BACK:', err.message);
  } finally {
    await db.close();
  }
}

fix();
