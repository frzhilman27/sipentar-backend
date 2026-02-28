const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { nik, name, email, password, jenis_kelamin, no_hp } = req.body;
  if (!nik || nik.length < 16) {
    return res.status(400).json({ message: "NIK harus 16 digit" });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (nik, name, email, password, jenis_kelamin, no_hp) VALUES ($1, $2, $3, $4, $5, $6)",
      [nik, name, email, hashed, jenis_kelamin || null, no_hp || null]
    );
    res.json({ message: "User berhasil daftar" });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: "NIK atau Email sudah terdaftar" });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { identifier, password, role_target } = req.body; // identifier can be NIK or Email

  // Validasi input
  if (!identifier || !password || !role_target) {
    return res.status(400).json({ message: "Silakan isi semua data dengan lengkap" });
  }

  // Tentukan apakah kita mencari berdasarkan NIK atau Email bergantung target Role
  let queryText = "";
  if (role_target === "admin") {
    // Admin HANYA boleh login pakai Email
    queryText = "SELECT * FROM users WHERE email = $1 AND role = 'admin'";
  } else if (role_target === "user") {
    // Warga HANYA boleh login pakai NIK
    queryText = "SELECT * FROM users WHERE nik = $1 AND role = 'user'";
  } else {
    return res.status(400).json({ message: "Portal tidak valid" });
  }

  try {
    const result = await db.query(queryText, [identifier]);

    if (result.rows.length === 0) {
      if (role_target === "admin") {
        return res.status(400).json({ message: "Email Admin tidak terdaftar atau tidak memiliki akses" });
      } else {
        return res.status(400).json({ message: "NIK Warga tidak ditemukan atau tidak valid" });
      }
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Password salah" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmail = async (req, res) => {
  const userId = req.user.id;
  const { newEmail, oldPassword } = req.body;

  if (!oldPassword || !newEmail) {
    return res.status(400).json({ message: "Email baru dan kata sandi lama wajib diisi." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });

    const user = result.rows[0];

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Kata sandi yang Anda masukkan salah!" });
    }

    if (newEmail === user.email) {
      return res.status(400).json({ message: "Alamat email baru sama dengan alamat email saat ini." });
    }

    await db.query("UPDATE users SET email = $1 WHERE id = $2", [newEmail, userId]);
    res.json({ message: "Email Anda berhasil diperbarui!" });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: "Email ini sudah terdaftar. Silakan gunakan alamat email lain." });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Kata sandi lama dan kata sandi baru wajib diisi." });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ message: "Kata sandi baru minimal 5 karakter." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });

    const user = result.rows[0];

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Kata sandi yang Anda masukkan salah!" });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNew, userId]);

    res.json({ message: "Kata sandi Anda berhasil diubah dengan aman!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfileInfo = async (req, res) => {
  const userId = req.user.id;
  const { newEmail, jenis_kelamin, no_hp } = req.body;
  const foto_profil = req.file ? `/uploads/${req.file.filename}` : null;

  if (!newEmail) {
    return res.status(400).json({ message: "Email wajib diisi." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });

    if (foto_profil) {
      await db.query(
        "UPDATE users SET email = $1, jenis_kelamin = $2, no_hp = $3, foto_profil = $4 WHERE id = $5",
        [newEmail, jenis_kelamin || null, no_hp || null, foto_profil, userId]
      );
    } else {
      await db.query(
        "UPDATE users SET email = $1, jenis_kelamin = $2, no_hp = $3 WHERE id = $4",
        [newEmail, jenis_kelamin || null, no_hp || null, userId]
      );
    }

    res.json({ message: "Informasi Profil Dasar Anda berhasil diperbarui!" });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: "Email ini sudah terdaftar oleh orang lain." });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      "SELECT id, nik, name, email, role, jenis_kelamin, no_hp, foto_profil, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Kata sandi otorisasi wajib diisi untuk menghapus akun." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });

    const user = result.rows[0];

    // Verifikasi kata sandi
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Kata sandi salah. Penghapusan akun dibatalkan." });
    }

    // Hapus akun, cascade laporan akan ikut terhapus
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({ message: "Seluruh data Akun Anda telah berhasil dihilangkan dari sistem." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
