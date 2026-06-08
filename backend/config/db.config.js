const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

let sequelize;

// 1. Check for Production Connection String (Standard for Render/Vercel Postgres)
if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL;

  // Fix Render internal URLs — convert to external hostname to bypass internal DNS issues.
  // Render internal hostnames look like: dpg-XXXXXXXX-a (no .region.render.com suffix)
  if (dbUrl.includes('dpg-') && !dbUrl.includes('.render.com')) {
    // Extract the internal hostname and append the correct external region suffix
    // Render external postgres hostnames follow: <id>.oregon-postgres.render.com OR <id>.singapore-postgres.render.com etc.
    // We try a generic approach — replace the short hostname with the long external form
    dbUrl = dbUrl.replace(
      /(@)(dpg-[a-z0-9]+(-[a-z])?)(\/)/,
      '$1$2.oregon-postgres.render.com$4'
    );
    console.log('🔄 Converted internal Render DB URL to external to bypass DNS issues.');
  }

  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Essential for Render/Supabase free tiers
      },
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
    sequelize = new Sequelize(
      process.env.DB_NAME || 'tally_replica',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
      }
    );
  } else if (dialect === 'mysql') {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'tally_replica',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
      }
    );
  }
}

module.exports = sequelize;

