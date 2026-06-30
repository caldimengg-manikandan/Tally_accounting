const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n', {
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

sequelize.query('SELECT id, name, "tdsApplicable", tds_section, tds_rate FROM "Ledgers" WHERE name = \'SecureNet IT Solutions Pvt. Ltd\'')
  .then(res => {
    console.log('Ledger:', res[0]);
    process.exit();
  })
  .catch(console.error);
