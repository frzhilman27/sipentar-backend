const db = require('./config/db');

async function checkUsers() {
    try {
        const res = await db.query('SELECT id, name, role, email, foto_profil FROM users');
        res.rows.forEach(u => {
            console.log(`User: ${u.name} (${u.role})`);
            if (u.foto_profil) {
                console.log(`  Foto Profil: starts with ${u.foto_profil.substring(0, 30)}... (length: ${u.foto_profil.length})`);
            } else {
                console.log(`  Foto Profil: NULL`);
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkUsers();
