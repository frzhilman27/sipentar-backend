const express = require("express");
const cors = require("cors");
const laporanRoutes = require("./routes/laporanRoutes");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(5000, () => {
  app.use("/uploads", express.static("uploads"));
  console.log("Server berjalan di http://localhost:5000 🔥");
});