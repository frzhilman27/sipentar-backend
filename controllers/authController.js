const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashed],
    (err) => {
      if (err) return res.status(400).json(err);
      res.json({ message: "User berhasil daftar" });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(400).json({ message: "User tidak ditemukan" });

      const user = results[0];

      const valid = await bcrypt.compare(password, user.password);

      if (!valid)
        return res.status(400).json({ message: "Password salah" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        "SECRET_KEY",
        { expiresIn: "1d" }
      );

      res.json({ token, role: user.role });
    }
  );
};