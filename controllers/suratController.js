const db = require("../config/db");

// ==========================================
// WARGA: Buat pengajuan surat baru
// ==========================================
exports.createSurat = async (req, res) => {
  const userId = req.user.id;
  const { jenis_surat, keperluan, data_tambahan } = req.body;

  if (!jenis_surat || !String(jenis_surat).trim()) {
    return res.status(400).json({ error: "Jenis surat wajib dipilih." });
  }
  if (!keperluan || !String(keperluan).trim()) {
    return res.status(400).json({ error: "Keperluan wajib diisi." });
  }

  try {
    // Cek verifikasi warga
    const userCheck = await db.query("SELECT is_verified FROM users WHERE id = $1", [userId]);
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_verified) {
      return res.status(403).json({ error: "Akun Anda belum diverifikasi oleh Admin. Tidak dapat mengajukan surat." });
    }

    // Anti-duplikat: cek jenis surat sama dalam 1 jam terakhir
    const dupeCheck = await db.query(
      "SELECT id FROM surat_pengajuan WHERE user_id = $1 AND jenis_surat = $2 AND created_at > NOW() - INTERVAL '1 hour'",
      [userId, jenis_surat]
    );
    if (dupeCheck.rows.length > 0) {
      return res.status(429).json({ error: "Anda baru saja mengajukan surat jenis yang sama. Harap tunggu minimal 1 jam." });
    }

    const result = await db.query(
      "INSERT INTO surat_pengajuan (user_id, jenis_surat, keperluan, data_tambahan) VALUES ($1, $2, $3, $4::jsonb) RETURNING id",
      [userId, jenis_surat, keperluan, JSON.stringify(data_tambahan || {})]
    );

    const suratId = result.rows[0].id;

    // Notifikasi ke semua admin
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
      await db.query(
        "INSERT INTO notifications (user_id, laporan_id, message) VALUES ($1, $2, $3)",
        [admin.id, null, `Pengajuan surat baru: "${jenis_surat}" dari warga (ID Surat: #${suratId})`]
      );
    }

    res.status(201).json({ message: "Pengajuan surat berhasil dikirim.", suratId });
  } catch (err) {
    console.error("Gagal buat pengajuan surat:", err);
    res.status(500).json({ error: "Gagal memproses pengajuan surat." });
  }
};

// ==========================================
// WARGA & ADMIN: Ambil daftar surat
// ==========================================
exports.getAllSurat = async (req, res) => {
  try {
    let result;
    if (req.user.role === "admin") {
      result = await db.query(
        `SELECT s.*, u.name, u.nik 
         FROM surat_pengajuan s 
         JOIN users u ON s.user_id = u.id 
         ORDER BY s.created_at DESC`
      );
    } else {
      result = await db.query(
        `SELECT s.*, u.name, u.nik 
         FROM surat_pengajuan s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.user_id = $1 
         ORDER BY s.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Gagal ambil data surat:", err);
    res.status(500).json({ error: "Gagal mengambil data surat." });
  }
};

// ==========================================
// ADMIN: Update status surat
// ==========================================
exports.updateStatusSurat = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya admin yang dapat mengubah status surat." });
  }

  const { id } = req.params;
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: "ID surat tidak valid." });
  }

  const { status, catatan_admin, nomor_surat } = req.body;

  const validStatuses = ["Menunggu", "Diproses", "Selesai", "Ditolak"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status tidak valid. Pilihan: Menunggu, Diproses, Selesai, Ditolak." });
  }

  try {
    const existing = await db.query("SELECT * FROM surat_pengajuan WHERE id = $1", [parsedId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Pengajuan surat tidak ditemukan." });
    }

    const oldStatus = existing.rows[0].status;
    const surat = existing.rows[0];

    // Update surat
    await db.query(
      `UPDATE surat_pengajuan 
       SET status = $1, catatan_admin = $2, nomor_surat = $3, updated_at = NOW() 
       WHERE id = $4`,
      [status, catatan_admin || null, nomor_surat || null, parsedId]
    );

    // Kirim notifikasi ke warga jika status berubah
    if (oldStatus !== status) {
      let notifMessage = `Status pengajuan surat "${surat.jenis_surat}" Anda berubah menjadi: ${status}`;
      if (status === "Selesai" && nomor_surat) {
        notifMessage += `. Nomor surat: ${nomor_surat}. Silakan ambil di balai desa.`;
      }
      if (status === "Ditolak" && catatan_admin) {
        notifMessage += `. Catatan: ${catatan_admin}`;
      }

      await db.query(
        "INSERT INTO notifications (user_id, laporan_id, message) VALUES ($1, $2, $3)",
        [surat.user_id, null, notifMessage]
      );
    }

    res.json({ message: "Status surat berhasil diperbarui." });
  } catch (err) {
    console.error("Gagal update status surat:", err);
    res.status(500).json({ error: "Gagal memperbarui status surat." });
  }
};

// ==========================================
// ADMIN: Hapus surat
// ==========================================
exports.deleteSurat = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak." });
  }

  const { id } = req.params;
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: "ID surat tidak valid." });
  }

  try {
    const check = await db.query("SELECT id FROM surat_pengajuan WHERE id = $1", [parsedId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Pengajuan surat tidak ditemukan." });
    }
    await db.query("DELETE FROM surat_pengajuan WHERE id = $1", [parsedId]);
    res.json({ message: "Pengajuan surat berhasil dihapus." });
  } catch (err) {
    console.error("Gagal hapus surat:", err);
    res.status(500).json({ error: "Gagal menghapus pengajuan surat." });
  }
};
