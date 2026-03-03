const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1] || req.headers.authorization;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Konfigurasi server belum lengkap (JWT_SECRET tidak disetel)" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token tidak valid" });
  }
};
