require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function runMigration() {
    try {
        console.log("Menjalankan migrasi database...");

        // Tambahkan kolom nik jika belum ada. 
        // Kita hapus semua user lama (kecuali admin) jika ada konflik null constraint atau kita allow null sementara lalu update.
        // Karena baru level development, kita alter langsung.
        const query = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS nik VARCHAR(16) UNIQUE;
    `;

        await pool.query(query);

        // Memberikan NIK dummy untuk admin yang sudah ada agar logic tidak error
        await pool.query("UPDATE users SET nik = '0000000000000000' WHERE role = 'admin' AND nik IS NULL");

        console.log("✅ Migrasi sukses: Kolom 'nik' berhasil ditambahkan ke tabel 'users'.");
    } catch (err) {
        console.error("❌ Gagal migrasi:", err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
