/**
 * config/env.validate.js
 * Phase 2: Boot-time environment variable validation.
 *
 * Called as the very first thing after dotenv.config() in server.js.
 * If any required variable is missing or empty, the process exits immediately
 * with a clear error — this prevents the server from running with undefined
 * JWT_SECRET (which would make ALL tokens forgeable).
 */

const REQUIRED_VARS = [
  { key: 'JWT_SECRET',          hint: 'Set to a long random string (min 32 chars), e.g. openssl rand -hex 32' },
  { key: 'Client_ID',           hint: 'Google OAuth Client ID from Google Cloud Console' },
  { key: 'Client_secret',       hint: 'Google OAuth Client Secret from Google Cloud Console' },
];

// DATABASE_URL is only required when not using SQLite fallback
const DB_VARS = [
  { key: 'DATABASE_URL', hint: 'Postgres connection string, e.g. postgres://user:pass@host:5432/db' },
];

module.exports = function validateEnv() {
  const missing = [];

  for (const { key, hint } of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push({ key, hint });
    }
  }

  // Only enforce DATABASE_URL if we're not running SQLite
  const dialect = process.env.DB_DIALECT || 'sqlite';
  if (dialect !== 'sqlite') {
    for (const { key, hint } of DB_VARS) {
      const value = process.env[key];
      if (!value || value.trim() === '') {
        missing.push({ key, hint });
      }
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    for (const { key, hint } of missing) {
      console.error(`   • ${key}: ${hint}`);
    }
    console.error('\nFix your .env file and restart the server.\n');
    process.exit(1);
  }

  // Warn (but don't exit) if JWT_SECRET looks too short
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is shorter than 32 characters. Use a longer secret in production.');
  }

  console.log('✅ Environment variables validated.');
};
