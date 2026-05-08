const db = require("./config/db");

async function migrate() {
    try {
        console.log("Starting migration...");
        
        // Add media_urls column if it doesn't exist
        await db.query(`
            ALTER TABLE laporan 
            ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
        `);
        console.log("Migration successful: Added media_urls column.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

migrate();
