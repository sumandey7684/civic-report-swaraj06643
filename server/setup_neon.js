const db = require('./db');

const createTables = async () => {
  try {
    console.log('Creating tables in Neon...');
    
    // Create profiles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT UNIQUE,
        profile_photo TEXT,
        bio TEXT,
        role TEXT DEFAULT 'citizen',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Profiles table created.');

    // Create issues table
    await db.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Issues table created.');

    console.log('Database setup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
};

createTables();
