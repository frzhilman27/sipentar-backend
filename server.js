require("dotenv").config();
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
   START SERVER
====================== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});