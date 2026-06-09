const db = require('../config/db');

async function migrate() {
    try {
        console.log("Menambahkan kolom prioritas dan confidence ke tabel laporan...");
        
        // Add prioritas column if it doesn't exist
        await db.query(`
            ALTER TABLE laporan 
            ADD COLUMN IF NOT EXISTS prioritas VARCHAR(20) DEFAULT 'Sedang';
        `);
        console.log("Kolom prioritas berhasil ditambahkan/sudah ada.");

        // Add confidence column if it doesn't exist
        await db.query(`
            ALTER TABLE laporan 
            ADD COLUMN IF NOT EXISTS confidence REAL DEFAULT 0.0;
        `);
        console.log("Kolom confidence berhasil ditambahkan/sudah ada.");
        
        console.log("Migrasi database selesai!");
        process.exit(0);
    } catch (err) {
        console.error("Gagal melakukan migrasi:", err);
        process.exit(1);
    }
}

migrate();
