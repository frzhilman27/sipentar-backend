const db = require("../config/db");

exports.createLaporan = async (req, res) => {
  console.log("createLaporan called.");
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);

  const { judul, isi } = req.body;
  const userId = req.user.id;
  const imageUrl = req.file ? req.file.filename : null;

  try {
    const insertResult = await db.query(
      "INSERT INTO laporan (user_id, judul, isi, image_url) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, judul, isi, imageUrl]
    );

    const laporanId = insertResult.rows[0].id;

    // Create notifications for all admins
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (let admin of admins.rows) {
      await db.query(
        "INSERT INTO notifications (user_id, laporan_id, message) VALUES ($1, $2, $3)",
        [admin.id, laporanId, `Ada laporan baru masuk: "${judul}"`]
      );
    }

    res.status(201).json({ message: "Laporan berhasil dikirim" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllLaporan = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT laporan.*, users.name 
       FROM laporan 
       JOIN users ON laporan.user_id = users.id 
       ORDER BY laporan.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query("UPDATE laporan SET status=$1 WHERE id=$2", [status, id]);

    // Get the user ID and Title of the report to notify the citizen
    const reportQuery = await db.query("SELECT user_id, judul FROM laporan WHERE id=$1", [id]);
    if (reportQuery.rows.length > 0) {
      const report = reportQuery.rows[0];
      await db.query(
        "INSERT INTO notifications (user_id, laporan_id, message) VALUES ($1, $2, $3)",
        [report.user_id, id, `Status laporan Anda "${report.judul}" berubah menjadi: ${status}`]
      );
    }

    res.json({ message: "Status diperbarui" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};