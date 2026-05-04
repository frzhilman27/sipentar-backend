require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // Wajib untuk mengatasi AggregateError PostgreSQL di Railway Cloud
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const laporanRoutes = require("./routes/laporanRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* ======================
   STATIC FILES
====================== */
// Serve static files from the 'uploads' folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/public", publicRoutes);

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

// Selalu ekspor app, apapun environmentnya
module.exports = app;

if (require.main === module) {
   // Jika file ini dijalankan langsung lewat Node (contoh: `node server.js` atau di Railway)
   app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
   });
}