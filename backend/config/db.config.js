const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

let sequelize;

// 1. Check for Production Connection String (Standard for Render/Vercel Postgres)
if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL;
  // Fix Render internal URLs that cause ENOTFOUND by appending the external region suffix
  if (dbUrl.includes('dpg-') && !dbUrl.includes('.render.com')) {
    dbUrl = dbUrl.replace(/(dpg-[a-z0-9-]+)(\/)/, '$1.singapore-postgres.render.com$2');
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
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    logging: false,
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

