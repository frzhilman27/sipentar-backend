const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("⚠️ DATABASE_URL environment variable is not configured. Database queries will fail.");
}

const pool = new Pool({
  connectionString: connectionString || "postgresql://dummy:dummy@localhost/dummy",
  ssl: { rejectUnauthorized: false },
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
