require("dotenv").config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function runDeploy() {
    try {
        console.log("Menyambung ke Database untuk migrasi fitur baru...");

        // 1. Tambahkan is_verified ke users
        console.log("-> Menambahkan is_verified ke users...");
        try {
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;");
            // Set existing users to true so they don't get locked out
            await pool.query("UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;");
            console.log("✅ Kolom is_verified sukses ditambahkan.");
        } catch (e) { console.log("⚠️ Info (users):", e.message); }

        // 2. Tambahkan admin_evidence_urls ke laporan
        console.log("-> Menyesuaikan struktur tabel laporan...");
        try {
            // Add column for JSON array of evidence urls
            await pool.query("ALTER TABLE laporan ADD COLUMN IF NOT EXISTS admin_evidence_urls JSONB DEFAULT '[]'::jsonb;");
            console.log("✅ Kolom admin_evidence_urls sukses ditambahkan.");
        } catch (e) { console.log("⚠️ Info (laporan):", e.message); }

        // 3. Buat tabel laporan_history
        console.log("-> Membuat tabel laporan_history...");
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS laporan_history (
                    id SERIAL PRIMARY KEY,
                    laporan_id INTEGER REFERENCES laporan(id) ON DELETE CASCADE,
                    status VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log("✅ Tabel laporan_history sukses didirikan.");
        } catch (e) { console.log("⚠️ Info (laporan_history):", e.message); }

        console.log("🚀 Migrasi Selesai!");
        
    } catch (error) {
        console.error("❌ Gagal migrasi:", error);
    } finally {
        pool.end();
    }
}

runDeploy();
