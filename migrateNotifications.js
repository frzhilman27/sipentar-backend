require("dotenv").config();
const db = require("./config/db");

async function migrateNotifications() {
    console.log("Menjalankan migrasi untuk tabel notifications...");

    try {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          laporan_id INTEGER REFERENCES laporan(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await db.query(createTableQuery);

        console.log("✅ Migrasi Tabel Notifications sukses!");
    } catch (err) {
        console.error("❌ Gagal menjalankan migrasi:", err.message);
    } finally {
        process.exit();
    }
}

migrateNotifications();
