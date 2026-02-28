require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function seedAdmin() {
    try {
        const hashed = await bcrypt.hash("123456", 10);
        await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
            ["Admin Sipentar", "admin@sipentar.com", hashed, "admin"]
        );
        console.log("✅ Akun Admin berhasil dibuat!");
        console.log("Email: admin@sipentar.com");
        console.log("Password: 123456");
    } catch (err) {
        if (err.code === "23505") {
            console.log("⚠️ Akun admin sudah ada di database.");
        } else {
            console.error("❌ Gagal membuat admin:", err.message);
        }
    } finally {
        await pool.end();
    }
}

seedAdmin();
