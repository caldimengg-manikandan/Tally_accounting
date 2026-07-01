const express = require('express'); // Restarted to apply recent DB schema updates
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const passport = require('passport');
const { sequelize } = require('./models');

// 1. Initial Config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middleware Strategy
app.use(cors(corsOptions));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(require('cookie-parser')()); // Phase 2: needed for httpOnly refresh token cookie
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add global CSRF Protection
const { csrfProtection } = require('./middleware/auth.middleware');
app.use(csrfProtection);

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
      { expiresIn: '15m' } // Phase 2: short-lived access token
    );
    res.redirect(`${CLIENT_URL}/auth-callback?token=${token}`);
  }
);
// 4. Modular Hub Routing
app.use('/api/payment', require('./modules/payment/payment.routes'));
app.use('/api/subscription', require('./modules/subscription/subscription.routes')); // SaaS Razorpay Integration
app.use('/api/support', require('./modules/support/support.routes')); // SaaS Support Ticket System
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/auth/users.routes'));          // User management (ADMIN)
app.use('/api/companies', require('./modules/company/company.routes'));
app.use('/api/groups', require('./modules/accounting/group.routes'));
app.use('/api/ledgers', require('./modules/accounting/ledger.routes'));
app.use('/api/vouchers', require('./modules/accounting/voucher.routes'));
app.use('/api/accounting', require('./modules/accounting/accounting.routes'));
app.use('/api/settings', require('./modules/settings/settings.routes'));
app.use('/api/roles', require('./modules/roles/roles.routes'));

app.use('/api/reports', require('./modules/reports/reports.routes'));
app.use('/api/sales', require('./modules/sales/sales.routes'));
app.use('/api/quotes', require('./modules/sales/quote.routes'));
app.use('/api/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/reconciliation', require('./modules/reconciliation/reconciliation.routes'));

// 5. Health Check
app.get('/api/ping', (req, res) => res.json({ status: 'active', platform: 'Tally Replica' }));

// 6. DB Sync & Boot Strategy
const dialect = process.env.DB_DIALECT || 'sqlite';
const syncOptions = dialect === 'sqlite' ? {} : { alter: true };

sequelize.sync(syncOptions).then(() => {
  console.log(`✅ Ledger Database Synced [${dialect}]`);
  app.listen(PORT, () => {
    console.log(`🚀 Tally Enterprise Hub online at PORT: ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Critical Hub Entry Failure:', err.message);
  process.exit(1);
});
