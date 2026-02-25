const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const laporanRoutes = require("./routes/laporanRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   CONNECT DATABASE
================================= */
connectDB();

/* ===============================
   MIDDLEWARE
================================= */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://sipentar-frontend.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

/* ===============================
   ROUTES
================================= */
app.get("/", (req, res) => {
  res.send("Sipentar Backend Running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/laporan", laporanRoutes);

/* ===============================
   CREATE ADMIN (TEMPORARY)
================================= */
app.post("/create-admin", async (req, res) => {
  try {
    const existing = await User.findOne({ email: "admin@gmail.com" });

    if (existing) {
      return res.send("Admin already exists");
    }

    const hashed = await bcrypt.hash("123456", 10);

    const admin = new User({
      email: "admin@gmail.com",
      password: hashed,
      role: "admin"
    });

    await admin.save();

    res.send("Admin created successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating admin");
  }
});

/* ===============================
   START SERVER
================================= */
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});