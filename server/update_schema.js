const db = require('./db');

const updateSchema = async () => {
  try {
    console.log('Updating schema in Neon...');
    
    // Add password column to profiles if it doesn't exist
    await db.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;
    `);
    console.log('Password column added to profiles.');

    process.exit(0);
  } catch (err) {
    console.error('Error updating schema:', err);
    process.exit(1);
  }
};

updateSchema();
