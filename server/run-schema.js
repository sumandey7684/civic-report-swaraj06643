// Run the Neon schema SQL against the database
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pool from "./db.js";

async function runSchema() {
  try {
    const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "neon_schema.sql"), "utf8");
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
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSchema();
