const { Pool } = require('pg');

// Menggunakan URL Database yang sudah dipastikan jalan (Hardcoded Neon DB dari db.js yang sukses)
const dbUrl = "postgresql://neondb_owner:npg_MnU7SdIWxb0k@ep-lucky-snow-akp3fclj-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function resetWargaData() {
    try {
        console.log("Menyambung ke Pangkalan-Data Awan Sipentar (Neon DB)...");

        // 1. Menghapus semua notifikasi (karena terkait dengan laporan/user yang akan dihapus)
        console.log("1. Mengosongkan tabel 'notifications'...");
        await pool.query("DELETE FROM notifications");

        // 2. Menghapus semua laporan (karena terkait dengan warga)
        console.log("2. Mengosongkan tabel 'laporan'...");
        await pool.query("DELETE FROM laporan");

        // 3. Menghapus akun warga, KECUALI akun Admin Utama
        console.log("3. Menghapus akun warga (kecuali Admin)...");
        const result = await pool.query("DELETE FROM users WHERE role != 'admin' OR email != 'admin@sipentar.com'");

        console.log(`✅ Sukses! ${result.rowCount} akun warga telah diberangus dari pangkalan data.`);
        console.log("Sekarang database Sipentar sudah suci kembali (Clean Slate) layaknya baru lahir.");
        console.log("Anda bisa mencoba fitur Pendaftaran Warga dari nol.");

    } catch (err) {
        console.error("❌ Terjadi Galat saat mengosongkan data:", err.message);
    } finally {
        pool.end();
    }
}

resetWargaData();
