require("dotenv").config();
const pool = require("../config/db");

const migrateImage = async () => {
    try {
        console.log("Starting migration to add image_url to laporan table...");

        await pool.query(`
      ALTER TABLE laporan 
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
    `);

        console.log("Migration successful: Added image_url column to laporan table.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateImage();
