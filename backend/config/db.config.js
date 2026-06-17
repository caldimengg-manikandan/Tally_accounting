const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

let sequelize;

// 1. Check for Production Connection String (Standard for Render/Vercel Postgres)
if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL;

  // Fix Render internal URLs — convert to external hostname to bypass internal DNS issues.
  if (dbUrl.includes('dpg-') && !dbUrl.includes('.render.com')) {
    dbUrl = dbUrl.replace(
      /(@)(dpg-[a-z0-9]+(-[a-z])?)(\/)/,
      '$1$2.oregon-postgres.render.com$4'
    );
    console.log('🔄 Converted internal Render DB URL to external to bypass DNS issues.');
  }

  // 🔐 SECURE TLS WITH CERTIFICATE VALIDATION
  const sslOptions = {
    require: true,
    rejectUnauthorized: process.env.NODE_ENV === 'production', // ✅ ENFORCE CERTIFICATE VERIFICATION IN PRODUCTION
  };

  // Load CA certificate if provided (for Render/Supabase with custom CAs)
  if (process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH)) {
    sslOptions.ca = fs.readFileSync(process.env.DB_SSL_CA_PATH).toString();
    console.log('🔒 Database CA Certificate loaded successfully.');
  } else {
    console.warn('⚠️ WARNING: DB_SSL_CA_PATH not found or file does not exist. SSL verification will run without custom CA.');
  }

  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: sslOptions,
      keepAlive: true,
      connectTimeout: 30000,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 120000,   // 2 minutes — Render cold-start DBs can be slow
      idle: 10000,
      evict: 30000,
    },
    logging: false,
    retry: {
      max: 3,
    },
  });
} 
// 2. Fallback to manual config or local SQLite
else {
  const dialect = process.env.DB_DIALECT || 'sqlite';

  if (dialect === 'sqlite') {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: false,
    });
  } else if (dialect === 'postgres') {
    const localSsl = process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: true } : false;
    
    sequelize = new Sequelize(
      process.env.DB_NAME || 'tally_replica',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        dialectOptions: {
          ssl: localSsl
        },
        logging: false,
      }
    );
  } else if (dialect === 'mysql') {
    const localSsl = process.env.NODE_ENV === 'production' ? true : false;
    sequelize = new Sequelize(
      process.env.DB_NAME || 'tally_replica',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        dialectOptions: {
          ssl: localSsl
        },
        logging: false,
      }
    );
  }
}

module.exports = sequelize;

