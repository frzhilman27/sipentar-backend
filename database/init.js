require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // neon requires SSL
});

async function initDB() {
    try {
        console.log("Mencoba koneksi ke database...");
        const schemaPath = path.join(__dirname, "schema.sql");
        const sql = fs.readFileSync(schemaPath, "utf8");

        console.log("Mengeksekusi schema.sql...");
        await pool.query(sql);

        console.log("✅ Tabel berhasil dibuat di PostgreSQL!");
    } catch (err) {
        console.error("❌ Gagal membuat tabel:", err.message);
    } finally {
        await pool.end();
    }
}

initDB();
