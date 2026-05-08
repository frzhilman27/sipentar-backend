const db = require("../config/db");

// In-memory idempotency store (per-process; resets on restart)
const _idempotencyStore = new Map();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup stale idempotency keys every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _idempotencyStore) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL_MS) {
      _idempotencyStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

exports.createLaporan = async (req, res) => {
  const { judul, isi, imageUrl } = req.body;
  const userId = req.user.id;

  const mediaFiles = req.files || [];
  const mediaUrls = mediaFiles.map(file => file.filename);

  try {
    // 0. Idempotency Key check (prevents double-click / network retry duplicates)
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (idempotencyKey) {
      const storeKey = `${userId}:${idempotencyKey}`;
      const existing = _idempotencyStore.get(storeKey);
      if (existing) {
        // Return the same response as the original request
        return res.status(existing.statusCode).json(existing.body);
      }
    }

    // 1. Check if user is verified
    const userCheck = await db.query("SELECT is_verified FROM users WHERE id = $1", [userId]);
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_verified) {
      return res.status(403).json({ error: "Akun Anda belum diverifikasi oleh Admin. Tidak dapat membuat laporan." });
    }

    // 2a. Anti-Spam: Prevent same report type from same user within 5 minutes
    const spamCheck = await db.query(
      "SELECT id FROM laporan WHERE user_id = $1 AND judul = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
      [userId, judul]
    );
    if (spamCheck.rows.length > 0) {
      return res.status(429).json({ error: "Anda baru saja mengirim laporan dengan jenis yang sama. Harap tunggu beberapa menit sebelum mengirim laporan serupa." });
    }

    // 2b. Prevent Exact Duplicate (same judul AND isi within 24 hours)
    const duplicateCheck = await db.query(
      "SELECT id FROM laporan WHERE user_id = $1 AND judul = $2 AND isi = $3 AND created_at > NOW() - INTERVAL '24 hours'",
      [userId, judul, isi]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: "Laporan dengan isi yang sama sudah pernah dikirimkan dalam 24 jam terakhir. Silakan periksa daftar laporan Anda." });
    }

    // 3. Insert Laporan
    const insertResult = await db.query(
      "INSERT INTO laporan (user_id, judul, isi, image_url, media_urls) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id",
      [userId, judul, isi, imageUrl, JSON.stringify(mediaUrls)]
    );

    const laporanId = insertResult.rows[0].id;

    // 4. Save to History
    await db.query(
      "INSERT INTO laporan_history (laporan_id, status) VALUES ($1, $2)",
      [laporanId, 'Menunggu']
    );

    // Create notifications for all admins
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (let admin of admins.rows) {
      await db.query(
        "INSERT INTO notifications (user_id, laporan_id, message) VALUES ($1, $2, $3)",
        [admin.id, laporanId, `Ada laporan baru masuk: "${judul}"`]
      );
    }

    const responseBody = { message: "Laporan berhasil dikirim", laporanId };
    const statusCode = 201;

    // Store idempotency result
    if (idempotencyKey) {
      _idempotencyStore.set(`${userId}:${idempotencyKey}`, {
        statusCode,
        body: responseBody,
        timestamp: Date.now()
      });
    }

    res.status(statusCode).json(responseBody);
  } catch (err) {
    console.error("Gagal simpan laporan:", err);
    res.status(500).json({ error: "Gagal memproses laporan." });
  }
};

exports.getAllLaporan = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      // Admin melihat semua laporan
      result = await db.query(
        `SELECT laporan.*, users.name 
         FROM laporan 
         JOIN users ON laporan.user_id = users.id 
         ORDER BY laporan.created_at DESC`
      );
    } else {
      // User biasa hanya melihat laporan miliknya sendiri
      result = await db.query(
        `SELECT laporan.*, users.name 
         FROM laporan 
         JOIN users ON laporan.user_id = users.id 
         WHERE laporan.user_id = $1
         ORDER BY laporan.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Gagal ambil laporan:", err);
    res.status(500).json({ error: "Gagal mengambil data laporan." });
  }
};

exports.updateStatus = async (req, res) => {
  // Hanya admin yang boleh mengubah status laporan
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Akses ditolak. Hanya admin yang dapat mengubah status laporan." });
  }

  const { id } = req.params;
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: "ID laporan tidak valid." });
  }

  const { status } = req.body;
  // Fallback if adminEvidenceUrls is passed as JSON body (backward compatibility)
  let adminEvidenceUrls = req.body.adminEvidenceUrls;
  if (typeof adminEvidenceUrls === 'string') {
     try { adminEvidenceUrls = JSON.parse(adminEvidenceUrls); } catch (e) {}
  }
  
  const adminMediaFiles = req.files || [];
  if (adminMediaFiles.length > 0) {
      adminEvidenceUrls = adminMediaFiles.map(file => file.filename);
  }

  // Validasi status value
  const validStatuses = ['Menunggu', 'Diproses', 'Selesai'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status tidak valid." });
  }

  try {
    if ((status === 'Diproses' || status === 'Selesai') && (!adminEvidenceUrls || adminEvidenceUrls.length === 0)) {
      return res.status(400).json({ error: `Foto lampiran bukti wajib diunggah saat merubah status ke "${status}".` });
    }

    // Check existing report status to prevent duplicate history if status didn't change
    const existing = await db.query("SELECT status FROM laporan WHERE id=$1", [parsedId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Laporan tidak ditemukan." });
    }
    const oldStatus = existing.rows[0].status;

    if (adminEvidenceUrls) {
        // If evidence provided, overwrite the JSON array
        await db.query("UPDATE laporan SET status=$1, admin_evidence_urls=$2::jsonb WHERE id=$3", [status, JSON.stringify(adminEvidenceUrls), parsedId]);
    } else {
        await db.query("UPDATE laporan SET status=$1 WHERE id=$2", [status, parsedId]);
    }

    if (oldStatus !== status) {
        // Only log to history if status actually changed
        await db.query(
            "INSERT INTO laporan_history (laporan_id, status) VALUES ($1, $2)",
            [parsedId, status]
        );
        
        // Get the user ID and Title of the report to notify the citizen
        const reportQuery = await db.query("SELECT user_id, judul FROM laporan WHERE id=$1", [parsedId]);
        if (reportQuery.rows.length > 0) {
          const report = reportQuery.rows[0];
          await db.query(
            "INSERT INTO notifications (user_id, laporan_id, message) VALUES ($1, $2, $3)",
            [report.user_id, parsedId, `Status laporan Anda "${report.judul}" berubah menjadi: ${status}`]
          );
        }
    }

    res.json({ message: "Status diperbarui" });
  } catch (err) {
    console.error("Gagal update status:", err);
    res.status(500).json({ error: "Gagal memperbarui status laporan." });
  }
};

exports.deleteLaporan = async (req, res) => {
    // Hanya admin yang boleh menghapus laporan
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Akses ditolak. Hanya admin yang dapat menghapus laporan." });
    }

    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "ID laporan tidak valid." });
    }

    try {
        const check = await db.query("SELECT id FROM laporan WHERE id = $1", [parsedId]);
        if (check.rows.length === 0) {
          return res.status(404).json({ error: "Laporan tidak ditemukan." });
        }
        await db.query("DELETE FROM laporan WHERE id = $1", [parsedId]);
        res.json({ message: "Laporan berhasil dihapus" });
    } catch (err) {
        console.error("Gagal hapus laporan:", err);
        res.status(500).json({ error: "Gagal menghapus laporan." });
    }
};

exports.getLaporanHistory = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "ID laporan tidak valid." });
    }

    try {
        const result = await db.query("SELECT * FROM laporan_history WHERE laporan_id = $1 ORDER BY created_at ASC", [parsedId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Gagal ambil riwayat:", err);
        res.status(500).json({ error: "Gagal mengambil histori laporan." });
    }
};