const db = require('./db');

const updateSchema = async () => {
  try {
    console.log('Adding missing columns to profiles...');
    await db.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aadhaar TEXT;
    `);
    console.log('Schema updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating schema:', err);
    process.exit(1);
  }
};

updateSchema();
