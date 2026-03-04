require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query("SELECT name, email, foto_profil FROM users ORDER BY created_at DESC LIMIT 5");
        console.log('--- LATEST USERS ---');
        res.rows.forEach(r => {
            console.log(`Name: ${r.name} | Foto Length: ${r.foto_profil ? r.foto_profil.length : 'NULL'}`);
            if (r.foto_profil) console.log(` Snippet: ${r.foto_profil.substring(0, 50)}...`);
        });
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
