const db = require("../config/db");

async function migrate() {
  try {
    // Tabel pengajuan surat desa
    await db.query(`
      CREATE TABLE IF NOT EXISTS surat_pengajuan (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        jenis_surat VARCHAR(100) NOT NULL,
        keperluan TEXT NOT NULL,
        data_tambahan JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'Menunggu',
        catatan_admin TEXT,
        nomor_surat VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel surat_pengajuan berhasil dibuat/sudah ada.");

    // Tabel pengumuman desa
    await db.query(`
      CREATE TABLE IF NOT EXISTS pengumuman (
        id SERIAL PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        isi TEXT NOT NULL,
        kategori VARCHAR(50) DEFAULT 'Pengumuman',
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel pengumuman berhasil dibuat/sudah ada.");

    // Tambah kolom catatan_admin di tabel laporan jika belum ada
    await db.query(`
      ALTER TABLE laporan ADD COLUMN IF NOT EXISTS catatan_admin TEXT;
    `);
    console.log("✅ Kolom catatan_admin di tabel laporan ditambahkan/sudah ada.");

    // Seed pengumuman awal agar landing page tidak kosong
    const existing = await db.query("SELECT COUNT(*) FROM pengumuman");
    if (parseInt(existing.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO pengumuman (judul, isi, kategori) VALUES
        ('Sipentar Hadir untuk Layanan Pelaporan Infrastruktur Desa', 'Pemerintah Desa Lamaran Tarung dengan bangga meluncurkan platform SIPENTAR sebagai media pelaporan infrastruktur dan pelayanan administrasi desa secara digital. Warga dapat mendaftar dan memanfaatkan layanan ini untuk menyampaikan keluhan, mengajukan surat, dan memantau progress penanganan secara real-time.', 'Pengumuman'),
        ('Kerja Bakti Rutin Perbaikan Saluran Air Desa', 'Pemerintah Desa menghimbau seluruh warga untuk berpartisipasi dalam kegiatan kerja bakti rutin perbaikan saluran air yang akan dilaksanakan setiap hari Jumat di masing-masing RT. Koordinasi lebih lanjut dapat dilakukan melalui ketua RT setempat.', 'Kegiatan'),
        ('Pastikan Data NIK dan KK Anda Sudah Terdaftar di Sistem', 'Untuk dapat menggunakan layanan Sipentar secara maksimal, pastikan data NIK dan Kartu Keluarga Anda telah terdaftar dan terverifikasi oleh admin desa. Kunjungi balai desa atau hubungi perangkat desa untuk proses verifikasi data kependudukan.', 'Pemberitahuan')
      `);
      console.log("✅ Seed pengumuman awal berhasil ditambahkan.");
    }

    console.log("\n🎉 Migrasi selesai!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migrasi gagal:", err.message);
    process.exit(1);
  }
}

migrate();
