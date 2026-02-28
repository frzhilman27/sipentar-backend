const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MnU7SdIWxb0k@ep-lucky-snow-akp3fclj-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
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