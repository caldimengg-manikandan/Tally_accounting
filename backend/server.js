const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { sequelize } = require('./models');
const path = require('path');

// 1. Initial Config (Loaded from backend/.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middleware Strategy
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Authentication Engine (Passport)
require('./config/passport');
app.use(passport.initialize());

// 🚀 CLOUD WORKSPACE HANDLERS (Direct Binding)
app.get('/api/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'], 
  session: false 
}));

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.get('/api/auth/callback', 
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: `${CLIENT_URL}/login?error=auth_failed` 
  }), 
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, role: req.user.role, companyId: req.user.activeCompanyId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.redirect(`${CLIENT_URL}/auth-callback?token=${token}`);
  }
);

// 4. Modular Hub Routing
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/auth/users.routes'));          // User management (ADMIN)
app.use('/api/companies', require('./modules/company/company.routes'));
app.use('/api/groups', require('./modules/accounting/group.routes'));
app.use('/api/ledgers', require('./modules/accounting/ledger.routes'));
app.use('/api/vouchers', require('./modules/accounting/voucher.routes'));
app.use('/api/accounting', require('./modules/accounting/accounting.routes'));
app.use('/api/purchase', require('./modules/accounting/purchase.routes'));
app.use('/api/reports', require('./modules/reports/reports.routes'));
app.use('/api/sales', require('./modules/sales/sales.routes'));
app.use('/api/quotes', require('./modules/sales/quote.routes'));
app.use('/api/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/reconciliation', require('./modules/reconciliation/reconciliation.routes'));
app.use('/api/cost-centers', require('./modules/accounting/costCenter.routes'));
app.use('/api/retainer-invoices', require('./modules/sales/retainerInvoice.routes'));
app.use('/api/recurring-invoices', require('./modules/sales/recurringInvoice.routes'));
app.use('/api/pricelists', require('./modules/inventory/pricelist.routes'));
app.use('/api/purchases', require('./modules/purchases/purchases.routes'));

// 5. Health Check
app.get('/api/ping', (req, res) => res.json({ status: 'active', platform: 'Tally Replica' }));

// 6. DB Sync & Boot Strategy
const dialect = process.env.DB_DIALECT || 'sqlite';
// Using alter:true to apply new company profile fields;
const syncOptions = { alter: true };

const cron = require('node-cron');
const recurringController = require('./modules/sales/recurringInvoice.controller');

// Run everyday at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('--- RUNNING RECURRING INVOICE AUTOMATION ---');
  await recurringController.processDueInvoices({}, { json: (r) => console.log('Cron Result:', r), status: () => ({ json: (r) => console.error('Cron Error:', r) }) });
});

sequelize.sync(syncOptions).then(() => {
  console.log(`✅ Ledger Database Synced [${dialect}]`);
  app.listen(PORT, () => {
    console.log(`🚀 Tally Enterprise Hub online at PORT: ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Critical Hub Entry Failure:', err.message);
  if (err.errors) {
    err.errors.forEach(e => console.error(`  - Field: ${e.path}, Message: ${e.message}, Value: ${e.value}`));
  } else {
    console.error(err);
  }
  process.exit(1);
});
