require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedAdmin() {
    try {
        console.log("Menyambung ke Database Neon...");

        // Perbaikan Darurat: Pastikan tabel users punya kolom identifier & is_admin jika skema lama
        try {
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS identifier VARCHAR(255) UNIQUE;");
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;");
        } catch (e) { console.log(e.message) }

        console.log("Memeriksa akun admin ...");
        const checkAdmin = await pool.query("SELECT * FROM users WHERE email = 'admin@sipentar.com'");

        if (checkAdmin.rows.length === 0) {
            console.log("Menciptakan Admin: admin@sipentar.com / admin123 ...");
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (identifier, name, email, password, is_admin, role) VALUES ($1, $2, $3, $4, $5, $6)",
                ['admin', 'Administrator Sipentar', 'admin@sipentar.com', hashedPassword, true, 'admin']
            );
            console.log("Akun Admin berhasil ditanam!");
        } else {
            console.log("Akun Admin sudah ada, menimpa ulang password agar pasti admin123...");
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query("UPDATE users SET password = $1, role = 'admin' WHERE email = 'admin@sipentar.com'", [hashedPassword]);
        }

        console.log("Penyemaian Selesai!");
    } catch (error) {
        console.error("Gagal melakukan penyemaian admin:", error.message);
    } finally {
        pool.end();
    }
}

seedAdmin();
