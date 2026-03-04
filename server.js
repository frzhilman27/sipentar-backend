require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // Wajib untuk mengatasi AggregateError PostgreSQL di Railway Cloud
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const laporanRoutes = require("./routes/laporanRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json());

/* ======================
   STATIC FILES
====================== */
// Serve static files from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/debug", (req, res) => {
   res.json({
      status: "Active",
      db_url_set: !!process.env.DATABASE_URL,
      jwt_secret_set: !!process.env.JWT_SECRET,
      port: process.env.PORT || "NOT_SET",
   });
});

app.get("/", (req, res) => {
   res.json({ message: "Sipentar API Running OK" });
});

/* ======================
   START SERVER / EXPORT APP
====================== */
const PORT = process.env.PORT || 8080;

if (process.env.VERCEL) {
   // Jika berjalan di Vercel, ekspor aplikasi untuk Serverless Functions
   console.log("Running in Vercel Serverless environment");
   module.exports = app;
} else {
   // Jika berjalan lokal atau di server biasa (seperti Railway)
   app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
   });

   // Tambahan untuk antisipasi jika di-require dari file lain (seperti api/index.js)
   module.exports = app;
}