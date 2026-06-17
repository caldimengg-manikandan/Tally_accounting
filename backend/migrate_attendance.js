// Migration: Upgrade Attendance table to full schema
// Run: node migrate_attendance.js  (from backend/ directory)

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
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
    console.log('Table may not exist yet or other error:', e.message);
  }

  const addColumn = async (colName, definition) => {
    if (!existingCols.map(c => c.toLowerCase()).includes(colName.toLowerCase())) {
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

  // Add CompanyId if missing
  await addColumn('CompanyId', { type: DataTypes.UUID, allowNull: true });

  // Add EmployeeId if missing
  await addColumn('EmployeeId', { type: DataTypes.UUID, allowNull: true });

  // Add or rename AttendanceDate
  const hasAttDate = existingCols.some(c => c.toLowerCase() === 'attendancedate');
  const hasDateOld = existingCols.some(c => c.toLowerCase() === 'date');
  if (!hasAttDate && hasDateOld) {
    try {
      await qi.renameColumn('Attendances', 'date', 'AttendanceDate');
      console.log('✅ Renamed date -> AttendanceDate');
    } catch (err) { console.log('Rename date:', err.message); }
  } else if (!hasAttDate && !hasDateOld) {
    await addColumn('AttendanceDate', { type: DataTypes.DATEONLY, allowNull: true });
  }

  // Handle Status ENUM
  const hasStatus = existingCols.some(c => c.toLowerCase() === 'status');
  if (!hasStatus) {
    try {
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_Attendances_Status" AS ENUM ('Present', 'Absent', 'Half-Day', 'Leave', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      await qi.addColumn('Attendances', 'Status', {
        type: '"enum_Attendances_Status"',
        defaultValue: 'Present',
        allowNull: true
      });
      console.log('✅ Added column: Status (ENUM)');
    } catch (err) {
      console.error('❌ Failed to add Status ENUM:', err.message);
      // Fallback: add as VARCHAR
      try {
        await qi.addColumn('Attendances', 'Status', { type: DataTypes.STRING, defaultValue: 'Present', allowNull: true });
        console.log('✅ Added column: Status (VARCHAR fallback)');
      } catch (err2) { console.error('Status fallback:', err2.message); }
    }
  } else {
    // Try to add new ENUM values
    const newVals = ['Half-Day', 'Leave', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', 'Holiday'];
    for (const val of newVals) {
      try {
        await sequelize.query(`ALTER TYPE "enum_Attendances_Status" ADD VALUE IF NOT EXISTS '${val}';`);
      } catch { /* ignore */ }
    }
    console.log('✅ Status ENUM values ensured');
  }

  await addColumn('LeaveType', { type: DataTypes.STRING, allowNull: true });
  await addColumn('WorkingHours', { type: DataTypes.DECIMAL(5, 2), allowNull: true });

  // Notes: rename from remarks if exists
  const hasNotes = existingCols.some(c => c.toLowerCase() === 'notes');
  const hasRemarks = existingCols.some(c => c.toLowerCase() === 'remarks');
  if (!hasNotes && hasRemarks) {
    try {
      await qi.renameColumn('Attendances', 'remarks', 'Notes');
      console.log('✅ Renamed remarks -> Notes');
    } catch (err) { console.log('Rename remarks:', err.message); }
  } else if (!hasNotes) {
    await addColumn('Notes', { type: DataTypes.TEXT, allowNull: true });
  }

  await addColumn('CheckInTime', { type: DataTypes.STRING, allowNull: true });
  await addColumn('CheckOutTime', { type: DataTypes.STRING, allowNull: true });
  await addColumn('IsApproved', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true });
  await addColumn('ApprovedBy', { type: DataTypes.UUID, allowNull: true });
  await addColumn('ApprovedDate', { type: DataTypes.DATE, allowNull: true });
  await addColumn('Latitude', { type: DataTypes.DECIMAL(10, 8), allowNull: true });
  await addColumn('Longitude', { type: DataTypes.DECIMAL(11, 8), allowNull: true });
  await addColumn('UpdatedBy', { type: DataTypes.UUID, allowNull: true });

  // Add partial unique index
  try {
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_company_employee_date"
      ON "Attendances" ("CompanyId", "EmployeeId", "AttendanceDate")
      WHERE "CompanyId" IS NOT NULL AND "EmployeeId" IS NOT NULL AND "AttendanceDate" IS NOT NULL;
    `);
    console.log('✅ Unique index created');
  } catch (err) {
    console.log('Index:', err.message);
  }

  console.log('\n✅ Migration complete!');
  await sequelize.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
