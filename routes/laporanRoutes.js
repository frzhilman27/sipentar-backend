const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

exports.createLaporan = (req, res) => {
  const { judul, isi } = req.body;
  const userId = req.user.id;
  const foto = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO laporan (user_id, judul, isi, foto) VALUES (?, ?, ?, ?)",
    [userId, judul, isi, foto],
    (err) => {
      if (err) return res.status(400).json(err);
      res.json({ message: "Laporan berhasil dikirim" });
    }
  );
};

const upload = multer({ storage });

router.post("/", auth, upload.single("foto"), createLaporan);
router.get("/", auth, getAllLaporan);
router.put("/:id", auth, updateStatus);

module.exports = router;