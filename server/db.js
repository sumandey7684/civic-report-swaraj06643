import dotenv from "dotenv";
import pg from "pg";
import dns from "node:dns";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env"), override: true });

const { Pool } = pg;

async function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const databaseUrl = new URL(connectionString);
  const hostname = databaseUrl.hostname;
  let addresses;

  try {
    const records = await dns.promises.lookup(hostname, { all: true });
    addresses = records.map(({ address }) => address);
  } catch (systemDnsError) {
    const resolver = new dns.Resolver();
    resolver.setServers(["1.1.1.1", "8.8.8.8"]);
    try {
      addresses = await new Promise((resolve, reject) => {
        resolver.resolve4(hostname, (error, records) => {
          if (error) reject(error);
          else resolve(records);
        });
      });
    } catch (publicDnsError) {
      throw new Error(
        `Could not resolve database host ${hostname}: ${publicDnsError.message}`,
        { cause: systemDnsError },
      );
    }
  }

  if (addresses.length === 0) {
    throw new Error(`Database host ${hostname} resolved to no addresses`);
  }

  databaseUrl.hostname = addresses[0];
  databaseUrl.searchParams.delete("sslmode");
  return new Pool({
    connectionString: databaseUrl.toString(),
    ssl: { rejectUnauthorized: true, servername: hostname },
    enableChannelBinding: true,
  });
}

const pool = await createPool();

pool.query("SELECT NOW()")
  .then(() => console.log("✅ Connected to Neon PostgreSQL"))
  .catch((err) => console.error("❌ Neon DB connection error:", err.message));

export default pool;
