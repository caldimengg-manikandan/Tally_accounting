// Migration: Upgrade Attendance table to full schema
// Run: node backend/migrate_attendance.js

require('dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function migrate() {
  const qi = sequelize.getQueryInterface();

  console.log('🔄 Starting Attendance table migration...');
  
  // Get existing columns
  let existingCols = [];
  try {
    const tableDesc = await qi.describeTable('Attendances');
    existingCols = Object.keys(tableDesc);
    console.log('Existing columns:', existingCols.join(', '));
  } catch (e) {
    console.log('Table may not exist yet:', e.message);
  }

  const addColumn = async (colName, definition) => {
    if (!existingCols.includes(colName)) {
      try {
        await qi.addColumn('Attendances', colName, definition);
        console.log(`✅ Added column: ${colName}`);
      } catch (err) {
        console.error(`❌ Failed to add ${colName}:`, err.message);
      }
    } else {
      console.log(`⏭️  Column already exists: ${colName}`);
    }
  };

  // Add all new columns
  await addColumn('CompanyId', { type: DataTypes.UUID, allowNull: true });
  await addColumn('EmployeeId', { type: DataTypes.UUID, allowNull: true });
  await addColumn('AttendanceDate', { type: DataTypes.DATEONLY, allowNull: true });
  
  // Handle Status ENUM - try to update the ENUM type
  if (!existingCols.includes('Status')) {
    try {
      // Create enum type first
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_Attendances_Status" AS ENUM ('Present', 'Absent', 'Half-Day', 'Leave', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday');
        EXCEPTION WHEN duplicate_object THEN
          NULL;
        END $$;
      `);
      await qi.addColumn('Attendances', 'Status', {
        type: DataTypes.ENUM('Present', 'Absent', 'Half-Day', 'Leave', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday'),
        defaultValue: 'Present',
        allowNull: true
      });
      console.log('✅ Added column: Status');
    } catch (err) {
      console.error('❌ Failed to add Status:', err.message);
    }
  } else {
    // Update existing ENUM to add new values
    try {
      const newValues = ['Half-Day', 'Leave', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday'];
      for (const val of newValues) {
        await sequelize.query(`
          DO $$ BEGIN
            ALTER TYPE "enum_Attendances_Status" ADD VALUE IF NOT EXISTS '${val}';
          EXCEPTION WHEN others THEN
            NULL;
          END $$;
        `).catch(() => {});
      }
      console.log('✅ Updated Status ENUM values');
    } catch (err) {
      console.log('Status ENUM update:', err.message);
    }
  }

  await addColumn('LeaveType', { type: DataTypes.STRING, allowNull: true });
  await addColumn('WorkingHours', { type: DataTypes.DECIMAL(5, 2), allowNull: true });
  await addColumn('Notes', { type: DataTypes.TEXT, allowNull: true });
  await addColumn('CheckInTime', { type: DataTypes.STRING, allowNull: true });
  await addColumn('CheckOutTime', { type: DataTypes.STRING, allowNull: true });
  await addColumn('IsApproved', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true });
  await addColumn('ApprovedBy', { type: DataTypes.UUID, allowNull: true });
  await addColumn('ApprovedDate', { type: DataTypes.DATE, allowNull: true });
  await addColumn('Latitude', { type: DataTypes.DECIMAL(10, 8), allowNull: true });
  await addColumn('Longitude', { type: DataTypes.DECIMAL(11, 8), allowNull: true });
  await addColumn('UpdatedBy', { type: DataTypes.UUID, allowNull: true });

  // Rename old columns if they exist
  if (existingCols.includes('date') && !existingCols.includes('AttendanceDate')) {
    try {
      await qi.renameColumn('Attendances', 'date', 'AttendanceDate');
      console.log('✅ Renamed date -> AttendanceDate');
    } catch (err) {
      console.log('Rename date:', err.message);
    }
  }

  if (existingCols.includes('status') && !existingCols.includes('Status')) {
    // Can't easily rename due to ENUM, just copy data
    console.log('⚠️  Manual action needed: copy status -> Status data if required');
  }

  if (existingCols.includes('remarks') && !existingCols.includes('Notes')) {
    try {
      await qi.renameColumn('Attendances', 'remarks', 'Notes');
      console.log('✅ Renamed remarks -> Notes');
    } catch (err) {
      console.log('Rename remarks:', err.message);
    }
  }

  // Add indexes
  try {
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_company_employee_date"
      ON "Attendances" ("CompanyId", "EmployeeId", "AttendanceDate")
      WHERE "CompanyId" IS NOT NULL AND "EmployeeId" IS NOT NULL AND "AttendanceDate" IS NOT NULL;
    `);
    console.log('✅ Added unique index: CompanyId + EmployeeId + AttendanceDate');
  } catch (err) {
    console.log('Index creation:', err.message);
  }

  console.log('\n✅ Migration complete!');
  await sequelize.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
