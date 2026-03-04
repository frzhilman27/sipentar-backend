const { Pool } = require("pg");
require("dotenv").config();
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("⚠️ DATABASE_URL environment variable is not configured. Database queries will fail.");
} else if (connectionString.includes("monorail.proxy.rlwy.net")) {
  // Hardcode IPv4 Vercel workaround untuk mencegah AggregateError (IPv6 failure)
  connectionString = connectionString.replace("monorail.proxy.rlwy.net", "66.33.22.237");
}

const pool = new Pool({
  connectionString: connectionString || "postgresql://dummy:dummy@localhost/dummy",
  ssl: { rejectUnauthorized: false },
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: process.env.VERCEL ? 1000 : 30000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database gagal connect:", err.message);
  } else {
    console.log("✅ PostgreSQL Terkoneksi (via pg Pool)");
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
