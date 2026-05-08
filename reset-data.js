require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Hapus semua notifikasi
    const notifResult = await client.query('DELETE FROM notifications');
    console.log(`✅ Notifikasi dihapus: ${notifResult.rowCount} record`);

    // 2. Hapus semua riwayat laporan
    const historyResult = await client.query('DELETE FROM laporan_history');
    console.log(`✅ Riwayat laporan dihapus: ${historyResult.rowCount} record`);

    // 3. Hapus semua laporan
    const laporanResult = await client.query('DELETE FROM laporan');
    console.log(`✅ Laporan dihapus: ${laporanResult.rowCount} record`);

    // 4. Hapus semua user dengan role 'user' (bukan admin)
    const userResult = await client.query("DELETE FROM users WHERE role = 'user'");
    console.log(`✅ Akun warga dihapus: ${userResult.rowCount} record`);

    // Tampilkan admin yang masih ada
    const admins = await client.query("SELECT id, name, email FROM users WHERE role = 'admin'");
    console.log(`\n🔒 Admin yang tetap tersimpan:`);
    admins.rows.forEach(a => console.log(`   - ${a.name} (${a.email})`));

    await client.query('COMMIT');
    console.log('\n🎉 Reset data selesai! Database siap untuk data baru.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Gagal reset:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

resetData();
