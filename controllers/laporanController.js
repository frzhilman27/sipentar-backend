const db = require("../config/db");

exports.createLaporan = (req, res) => {
  const { judul, isi } = req.body;
  const userId = req.user.id;

  db.query(
    "INSERT INTO laporan (user_id, judul, isi) VALUES (?, ?, ?)",
    [userId, judul, isi],
    (err) => {
      if (err) return res.status(400).json(err);
      res.json({ message: "Laporan berhasil dikirim" });
    }
  );
};

exports.getAllLaporan = (req, res) => {
  db.query(
    `SELECT laporan.*, users.name 
     FROM laporan 
     JOIN users ON laporan.user_id = users.id 
     ORDER BY laporan.created_at DESC`,
    (err, results) => {
      if (err) return res.status(400).json(err);
      res.json(results);
    }
  );
};

exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE laporan SET status=? WHERE id=?",
    [status, id],
    (err) => {
      if (err) return res.status(400).json(err);
      res.json({ message: "Status diperbarui" });
    }
  );
};