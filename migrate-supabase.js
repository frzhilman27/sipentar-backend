const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// URL dari screenshot pengguna dengan @ di-encode menjadi %40 untuk password
const supabaseUrl = "postgresql://postgres.zjhpfxgidfjwhvbfmfku:sipentar%4012345@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString: supabaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function migrateSupabase() {
    try {
        console.log("Menyambung ke Database Supabase Pengguna...");

        // 1. Eksekusi Schema
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log("-> Tabel utama (schema) berhasil didirikan di Supabase.");

        // Perbaikan kolom identifier (Berjaga-jaga)
        try {
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS identifier VARCHAR(255) UNIQUE;");
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;");
        } catch (e) { }

        // 2. Suntik Akun Admin
        const checkAdmin = await pool.query("SELECT * FROM users WHERE email = 'admin@sipentar.com'");
        if (checkAdmin.rows.length === 0) {
            console.log("-> Menciptakan Admin (admin@sipentar.com / admin123) di Supabase...");
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (identifier, name, email, password, is_admin, role) VALUES ($1, $2, $3, $4, $5, $6)",
                ['admin', 'Administrator Sipentar', 'admin@sipentar.com', hashedPassword, true, 'admin']
            );
            console.log("-> Akun Admin Supabase sukses ditanam!");
        } else {
            console.log("-> Akun Admin sudah ada di Supabase, menimpa ulang password..");
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query("UPDATE users SET password = $1, role = 'admin' WHERE email = 'admin@sipentar.com'", [hashedPassword]);
        }
        console.log("✅ Migrasi Supabase Tuntas!");
    } catch (error) {
        console.error("❌ Gagal migrasi Supabase:", error.message);
    } finally {
        pool.end();
    }
}

migrateSupabase();
