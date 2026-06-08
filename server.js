require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // Mengatasi AggregateError PostgreSQL di cloud environments
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const laporanRoutes = require("./routes/laporanRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const publicRoutes = require("./routes/publicRoutes");
const suratRoutes = require("./routes/suratRoutes");

const app = express();

/* ======================
   MIDDLEWARE
====================== */
// CORS — hanya izinkan frontend yang terdaftar
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app for preview deployments
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Akses CORS tidak diizinkan dari origin: ' + origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve file upload secara statis
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/surat", suratRoutes);

app.get("/", (req, res) => {
   res.json({ message: "Sipentar API Running OK" });
});

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (err instanceof require("multer").MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Ukuran file melebihi batas maksimal (50MB per file)." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Maksimal 5 file media per laporan." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message && err.message.includes("Hanya diperbolehkan")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

/* ======================
   START SERVER / EXPORT APP
====================== */
const PORT = process.env.PORT || 8080;

// Selalu ekspor app, apapun environmentnya
module.exports = app;

if (require.main === module) {
   // Jika file ini dijalankan langsung lewat Node (contoh: `node server.js`)
   app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
   });
}