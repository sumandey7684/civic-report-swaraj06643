import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_UbSm85aijtLJ@ep-plain-cell-anpq9926-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

// Test connection on startup
pool.query("SELECT NOW()")
  .then(() => console.log("✅ Connected to Neon PostgreSQL"))
  .catch((err) => console.error("❌ Neon DB connection error:", err.message));

export default pool;
