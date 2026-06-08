const db = require("../config/db");

exports.getStats = async (req, res) => {
  try {
    const totalWargaResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const laporanSelesaiResult = await db.query("SELECT COUNT(*) FROM laporan WHERE status = 'Selesai'");
    const layananAktifResult = await db.query("SELECT COUNT(*) FROM laporan WHERE status IN ('Menunggu', 'Diproses')");
    
    // Statistik surat
    let suratSelesai = "0";
    let suratAktif = "0";
    try {
      const suratSelesaiResult = await db.query("SELECT COUNT(*) FROM surat_pengajuan WHERE status = 'Selesai'");
      suratSelesai = suratSelesaiResult.rows[0].count;
      const suratAktifResult = await db.query("SELECT COUNT(*) FROM surat_pengajuan WHERE status IN ('Menunggu', 'Diproses')");
      suratAktif = suratAktifResult.rows[0].count;
    } catch (e) {
      // Tabel surat_pengajuan mungkin belum ada
    }

    res.json({
      totalWarga: totalWargaResult.rows[0].count,
      laporanSelesai: laporanSelesaiResult.rows[0].count,
      layananAktif: layananAktifResult.rows[0].count,
      suratSelesai,
      suratAktif,
      rtRw: "27/9"
    });
  } catch (err) {
    console.error("Gagal mengambil statistik:", err);
    res.status(500).json({ error: "Gagal mengambil data statistik desa." });
  }
};

// Mengambil daftar pengumuman untuk landing page
exports.getPengumuman = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, judul, isi, kategori, created_at FROM pengumuman WHERE is_published = TRUE ORDER BY created_at DESC LIMIT 6"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Gagal mengambil pengumuman:", err);
    // Fallback jika tabel belum ada
    res.json([]);
  }
};
