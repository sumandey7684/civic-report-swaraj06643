// Run the Neon schema SQL against the database
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runSchema() {
  try {
    const sql = readFileSync(join(__dirname, "..", "neon_schema.sql"), "utf8");
    await pool.query(sql);
    console.log("✅ Schema created successfully!");
    
    // Verify tables exist
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("📋 Tables:", tables.rows.map(r => r.table_name).join(", "));
  } catch (err) {
    console.error("❌ Schema error:", err.message);
  } finally {
    await pool.end();
  }
}

runSchema();
