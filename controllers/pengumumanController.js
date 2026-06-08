const db = require("../config/db");

// Ambil semua pengumuman (untuk admin, termasuk yang tidak di-publish)
exports.getAllPengumuman = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM pengumuman ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil pengumuman." });
  }
};

// Tambah pengumuman baru
exports.createPengumuman = async (req, res) => {
  const { judul, isi, kategori, is_published } = req.body;
  if (!judul || !isi || !kategori) {
    return res.status(400).json({ error: "Judul, isi, dan kategori wajib diisi." });
  }

  try {
    const result = await db.query(
      "INSERT INTO pengumuman (judul, isi, kategori, is_published) VALUES ($1, $2, $3, $4) RETURNING *",
      [judul, isi, kategori, is_published !== undefined ? is_published : true]
    );
    res.status(201).json({ message: "Pengumuman berhasil ditambahkan.", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menambahkan pengumuman." });
  }
};

// Update pengumuman
exports.updatePengumuman = async (req, res) => {
  const { id } = req.params;
  const { judul, isi, kategori, is_published } = req.body;

  try {
    const result = await db.query(
      "UPDATE pengumuman SET judul=$1, isi=$2, kategori=$3, is_published=$4 WHERE id=$5 RETURNING *",
      [judul, isi, kategori, is_published, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pengumuman tidak ditemukan." });
    }

    res.json({ message: "Pengumuman berhasil diperbarui.", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui pengumuman." });
  }
};

// Hapus pengumuman
exports.deletePengumuman = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM pengumuman WHERE id=$1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pengumuman tidak ditemukan." });
    }
    res.json({ message: "Pengumuman berhasil dihapus." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus pengumuman." });
  }
};
