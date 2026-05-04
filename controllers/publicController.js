const db = require("../config/db");

exports.getStats = async (req, res) => {
  try {
    const totalWargaResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'warga'");
    const laporanSelesaiResult = await db.query("SELECT COUNT(*) FROM laporan WHERE status = 'Selesai'");
    // "Layanan Aktif" represent total laporan yang sedang diproses atau menunggu
    const layananAktifResult = await db.query("SELECT COUNT(*) FROM laporan WHERE status IN ('Menunggu', 'Diproses')");
    
    // Asumsikan jumlah RT/RW statis atau manual, kita set default 4/24 jika tidak ada tabel khusus
    
    res.json({
      totalWarga: totalWargaResult.rows[0].count,
      laporanSelesai: laporanSelesaiResult.rows[0].count,
      layananAktif: layananAktifResult.rows[0].count,
      rtRw: "4/24"
    });
  } catch (err) {
    console.error("Gagal mengambil statistik:", err);
    res.status(500).json({ error: "Gagal mengambil data statistik desa." });
  }
};
