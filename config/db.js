const { Pool } = require("pg");
require("dotenv").config();
const dns = require("dns");

// Memaksa DNS node resolving ke IPv4 karena Railway DB dan Node 20 Vercel sering konflik IPv6 yang menyebabkan AggregateError
dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("⚠️ DATABASE_URL environment variable is not configured. Database queries will fail.");
}

const pool = new Pool({
  connectionString: connectionString || "postgresql://dummy:dummy@localhost/dummy",
  ssl: { rejectUnauthorized: false },
  max: process.env.VERCEL ? 1 : 10, // Di serverless seperti Vercel, max 1 koneksi per fungsi agar tidak menghabiskan limit Railway
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
