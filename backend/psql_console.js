/**
 * Interactive PostgreSQL console for your Render DB
 * Usage: node psql_console.js
 * Type any SQL and press Enter. Type \q to quit, \dt to list tables.
 */

const { Sequelize } = require('sequelize');
const readline = require('readline');

const db = new Sequelize(
  'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
  { dialect: 'postgres', dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, logging: false }
);

// Built-in shortcuts like real psql
const SHORTCUTS = {
  '\\dt': `SELECT tablename as "Table", pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) as "Size" FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
  '\\d':  `SELECT tablename as "Table" FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
  '\\du': `SELECT usename as "User", usesuper as "Superuser", usecreatedb as "CreateDB" FROM pg_user`,
  '\\l':  `SELECT datname as "Database", pg_size_pretty(pg_database_size(datname)) as "Size" FROM pg_database`,
};

function formatTable(rows) {
  if (!rows || rows.length === 0) return '(0 rows)';
  const cols = Object.keys(rows[0]);
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
  const line = widths.map(w => '-'.repeat(w + 2)).join('+');
  const header = cols.map((c, i) => ` ${c.padEnd(widths[i])} `).join('|');
  const divider = '+' + line + '+';
  const body = rows.map(r => '|' + cols.map((c, i) => ` ${String(r[c] ?? '').padEnd(widths[i])} `).join('|') + '|');
  return [divider, '|' + header + '|', divider, ...body, divider, `(${rows.length} row${rows.length !== 1 ? 's' : ''})`].join('\n');
}

async function main() {
  try {
    await db.authenticate();
    console.log('✅ Connected to tally_db_9r2n on Render (PostgreSQL)');
    console.log('   Type SQL queries and press Enter. Shortcuts: \\dt \\du \\l \\q');
    console.log('   Multi-line: end with ; to execute\n');
  } catch (e) {
    console.error('❌ Connection failed:', e.message);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let buffer = '';

  const prompt = () => process.stdout.write(buffer ? 'tally=#  ' : 'tally=# ');
  prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    // Quit
    if (trimmed === '\\q' || trimmed === 'exit' || trimmed === 'quit') {
      console.log('Bye!');
      await db.close();
      process.exit(0);
    }

    // Help
    if (trimmed === '\\?' || trimmed === 'help') {
      console.log('  \\dt  — list tables          \\du — list users');
      console.log('  \\l   — list databases       \\q  — quit');
      console.log('  Any SQL statement ending with ; will be executed');
      prompt(); return;
    }

    // Clear
    if (trimmed === '\\c' || trimmed === 'clear') {
      buffer = ''; prompt(); return;
    }

    // Handle shortcuts
    if (SHORTCUTS[trimmed]) {
      try {
        const [rows] = await db.query(SHORTCUTS[trimmed]);
        console.log(formatTable(rows));
      } catch (e) { console.error('Error:', e.message); }
      prompt(); return;
    }

    // Describe table: \d tablename
    if (trimmed.startsWith('\\d ')) {
      const tbl = trimmed.slice(3).trim();
      try {
        const [rows] = await db.query(
          `SELECT column_name as "Column", data_type as "Type", is_nullable as "Nullable", column_default as "Default"
           FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
          { bind: [tbl] }
        );
        if (rows.length === 0) console.log(`Did not find table "${tbl}"`);
        else { console.log(`\nTable: "${tbl}"`); console.log(formatTable(rows)); }
      } catch (e) { console.error('Error:', e.message); }
      prompt(); return;
    }

    // Accumulate multi-line SQL
    buffer += (buffer ? '\n' : '') + line;

    // Execute when line ends with ;
    if (buffer.trimEnd().endsWith(';')) {
      const sql = buffer.trim().replace(/;$/, '');
      buffer = '';
      try {
        const start = Date.now();
        const [rows] = await db.query(sql);
        const elapsed = Date.now() - start;
        if (Array.isArray(rows) && rows.length > 0 && typeof rows[0] === 'object') {
          console.log(formatTable(rows));
        } else if (typeof rows === 'number') {
          console.log(`(${rows} rows affected)`);
        } else {
          console.log('OK');
        }
        console.log(`Time: ${elapsed}ms`);
      } catch (e) {
        console.error('ERROR:', e.message.split('\n')[0]);
      }
      prompt();
    } else {
      // waiting for more input
      process.stdout.write('tally-# ');
    }
  });
}

main();
