const router = require("express").Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { nama, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (nama,email,password) VALUES (?,?,?)",
    [nama, email, hash],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Register berhasil" });
    }
  );
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json("User tidak ditemukan");

    const valid = await bcrypt.compare(password, result[0].password);
    if (!valid) return res.status(400).json("Password salah");

    const token = jwt.sign(
      { id: result[0].id, role: result[0].role },
      "secretkey"
    );

    res.json({ token, role: result[0].role });
  });
});

module.exports = router;