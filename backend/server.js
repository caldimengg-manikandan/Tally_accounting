const express = require('express'); // Restarted to apply recent DB schema updates
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const passport = require('passport');
const { sequelize } = require('./models');
const path = require('path');

// 1. Initial Config (Loaded from backend/.env)
dotenv.config({ path: path.join(__dirname, '.env') });

// Phase 2: Validate required env vars before any other code runs
// If JWT_SECRET or other critical vars are missing, process.exit(1) is called.
require('./config/env.validate')();

console.log('--- DATABASE CONFIGURATION ENGINE ---');
if (process.env.DATABASE_URL) {
  console.log('Connecting to CLOUD POSTGRES via DATABASE_URL');
} else {
  console.log(`DATABASE_URL not found. Dialect: ${process.env.DB_DIALECT || 'sqlite'}`);
}

const app = express();
const PORT = process.env.PORT || 5000;

// 🔐 SECURITY LAYER 1: Helmet Headers (blocks browser-level attacks)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Tighten after testing
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}));

// 🔐 SECURITY LAYER 2: CORS (restrict to known origins)
// Build allowed origins dynamically from env — never hardcode production domains here
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
];
if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
  // Support comma-separated list in env: ADDITIONAL_ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
  allowedOrigins.push(...process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Auto-allow Render and Vercel preview environments
    if (origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) return callback(null, true);
    // If we're in production without a specific CLIENT_URL, allow anyway to prevent locking out the frontend
    if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  optionsSuccessStatus: 200
};

if (!process.env.CLIENT_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: CLIENT_URL not set in production. Using fallback CORS rules.');
}

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
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/auth/users.routes'));          // User management (ADMIN)
app.use('/api/companies', require('./modules/company/company.routes'));
app.use('/api/groups', require('./modules/accounting/group.routes'));
app.use('/api/ledgers', require('./modules/accounting/ledger.routes'));
app.use('/api/vouchers', require('./modules/accounting/voucher.routes'));
app.use('/api/accounting', require('./modules/accounting/accounting.routes'));

app.use('/api/reports', require('./modules/reports/reports.routes'));
app.use('/api/sales', require('./modules/sales/sales.routes'));
app.use('/api/quotes', require('./modules/sales/quote.routes'));
app.use('/api/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/reconciliation', require('./modules/reconciliation/reconciliation.routes'));
app.use('/api/cost-centers', require('./modules/accounting/costCenter.routes'));
app.use('/api/currencies', require('./modules/accounting/currency.routes'));
app.use('/api/cost-categories', require('./modules/accounting/costCategory.routes'));
app.use('/api/retainer-invoices', require('./modules/sales/retainerInvoice.routes'));
app.use('/api/recurring-invoices', require('./modules/sales/recurringInvoice.routes'));
app.use('/api/pricelists', require('./modules/inventory/pricelist.routes'));
app.use('/api/:companyId/purchases', require('./modules/purchases/purchases.routes'));

app.use('/api/mail', require('./modules/mail/mail.routes'));
app.use('/api/tax/gst', require('./modules/tax/gst.routes'));
app.use('/api/payroll', require('./modules/payroll/payroll.routes'));
app.use('/api/attendances', require('./modules/payroll/attendance.routes'));
app.use('/api/salary', require('./modules/payroll/salary.routes'));
app.use('/api/salary-slips', require('./modules/payroll/salarySlip.routes'));
app.use('/api/fixed-assets', require('./modules/fixed_assets/fixedAssets.routes'));
app.use('/api/manufacturing', require('./modules/manufacturing/manufacturing.routes'));
app.use('/api/budgets', require('./modules/budgeting/budgeting.routes'));
app.use('/api/delivery-challans', require('./modules/sales/deliveryChallan.routes'));
app.use('/api/credit-notes', require('./modules/sales/creditNote.routes'));
app.use('/api/projects', require('./modules/time_tracking/project.routes'));
app.use('/api/timesheets', require('./modules/time_tracking/timesheet.routes'));

// ⚠️  DEBUG ENDPOINTS — only active in development, removed from production
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/fixed-assets-debug', async (req, res) => {
    try {
      const { FixedAsset, DepreciationLog, Ledger } = require('./models');
      const assets = await FixedAsset.findAll({
        include: [
          { model: DepreciationLog },
          { model: Ledger, as: 'AssetLedger', attributes: ['name'] }
        ]
      });
      res.json({ status: 'ok', count: assets.length, assets });
    } catch (err) {
      // Safe in dev — full details only shown in development
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  app.get('/api/test-tenant-access', async (req, res) => {
    try {
      const { User, Company } = require('./models');
      const user = await User.findOne({
        where: { email: 'lokeshwari@gmail.com' },
        include: [Company]
      });
      const companyIdToCheck = '9e2261ae-dd0a-47f9-b14d-5c6fb9dfb505';
      const hasAccess = user.Companies && user.Companies.some(c => c.id === companyIdToCheck);
      res.json({ user: user.email, hasAccess, companies: user.Companies });
    } catch (err) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });
}

// 5. Health Check
app.get('/api/ping', (req, res) => res.json({ status: 'active', platform: 'Tally Replica' }));

// 6. DB Sync & Boot Strategy
const dialect = process.env.DB_DIALECT || 'sqlite';
// Use alter:true only for local SQLite; disabled for cloud Postgres to prevent sync locks
const syncOptions = process.env.DATABASE_URL ? {} : { alter: true };

const cron = require('node-cron');
const recurringController = require('./modules/sales/recurringInvoice.controller');

// Run everyday at midnight — recurring invoice automation
cron.schedule('0 0 * * *', async () => {
  console.log('--- RUNNING RECURRING INVOICE AUTOMATION ---');
  await recurringController.processDueInvoices({}, { json: (r) => console.log('Cron Result:', r), status: () => ({ json: (r) => console.error('Cron Error:', r) }) });
});

// Extra 1: Run every day at 1am — purge expired refresh tokens to prevent DB bloat
cron.schedule('0 1 * * *', async () => {
  try {
    const { RefreshToken } = require('./models');
    const { Op } = require('sequelize');
    const deleted = await RefreshToken.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } }
    });
    console.log(`--- REFRESH TOKEN CLEANUP: removed ${deleted} expired rows ---`);
  } catch (err) {
    console.error('--- REFRESH TOKEN CLEANUP FAILED:', err.message);
  }
});

// 🔐 SECURITY LAYER: Global Error Handler (never expose internal errors)
app.use((err, req, res, next) => {
  // Generate error tracking ID
  const errorId = require('crypto').randomBytes(8).toString('hex');
  
  // Log full error server-side for debugging
  console.error(`[ERROR-${errorId}]`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'anonymous'
  });

  // Return generic error to client (never expose internal details)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: 'An error occurred processing your request',
    errorId: errorId // User can report this ID for support
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

const startServer = async () => {
  // Bind port immediately and wait for it to be ready
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Tally Enterprise Hub online at PORT: ${PORT}`);
      resolve(server);
    }).on('error', (err) => {
      console.error(`❌ Failed to bind to PORT: ${PORT}`, err);
      reject(err);
    });
  });

  let retries = 8;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection authenticated.');
      await sequelize.sync(syncOptions);
      const connectedTo = process.env.DATABASE_URL ? 'Cloud Postgres' : (process.env.DB_DIALECT || 'sqlite');
      console.log(`✅ Ledger Database Synced [${connectedTo}]`);
      break; // Success, exit retry loop
    } catch (err) {
      console.error('❌ Database connection/sync failed:', err.message);
      retries -= 1;
      console.log(`Retries left: ${retries}. Waiting 10 seconds before retrying...`);
      if (retries === 0) {
        console.error('❌ Critical Hub Entry Failure: Could not connect to database after multiple attempts.');
        if (err.errors) {
          err.errors.forEach(e => console.error(`  - Field: ${e.path}, Message: ${e.message}, Value: ${e.value}`));
        } else {
          console.error(err);
        }
        process.exit(1);
      }
      // Wait 10 seconds before retrying (handles Render DB cold-start delays)
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
};

startServer();
