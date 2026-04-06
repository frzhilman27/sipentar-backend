require("dotenv").config();
const pool = require("../config/db");

const migrateEvidence = async () => {
    try {
        console.log("Starting migration to add admin_evidence_url to laporan table...");

        await pool.query(`
      ALTER TABLE laporan 
      ADD COLUMN IF NOT EXISTS admin_evidence_url TEXT;
    `);

        console.log("Migration successful: Added admin_evidence_url column to laporan table.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateEvidence();
