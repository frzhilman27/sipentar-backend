require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log("Menyambung ke Database Cloud...");

        // 1. Jalankan schema.sql
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Mengeksekusi isi schema.sql...");
        await pool.query(schemaSql);
        console.log("Tabel utama berhasil dibuat/diverifikasi!");

        // 2. Suntikkan Akun Admin Default (jika belum ada)
        console.log("Memeriksa akun admin bawaan...");
        const checkAdmin = await pool.query("SELECT * FROM users WHERE email = 'admin@sipentar.com' OR identifier = 'admin'");

        if (checkAdmin.rows.length === 0) {
            console.log("Akun Admin belum ditemukan. Menciptakan Admin baru (admin / admin123)...");
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (identifier, password, name, phone, email, is_admin) VALUES ($1, $2, $3, $4, $5, $6)",
                ['admin', hashedPassword, 'Sistem Admin', '081234567890', 'admin@sipentar.com', true]
            );
            console.log("Akun Admin berhasil ditanam!");
        } else {
            console.log("Akun Admin sudah ada di cloud database.");
        }

        console.log("Penyemaian Database Selesai!");
    } catch (error) {
        console.error("Gagal melakukan migrasi cloud:", error);
    } finally {
        pool.end();
    }
}

migrate();
