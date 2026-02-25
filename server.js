const express = require("express");
const cors = require("cors");
const laporanRoutes = require("./routes/laporanRoutes");
const PORT = process.env.PORT || 5000;

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://sipentar-frontend.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Sipentar Backend Running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);

app.post("/create-admin", async (req, res) => {
  const bcrypt = require("bcryptjs");
  const User = require("./models/User");

  const hashed = await bcrypt.hash("123456", 10);

  const admin = new User({
    email: "admin@gmail.com",
    password: hashed,
    role: "admin"
  });

  await admin.save();

  res.send("Admin created");
});

});