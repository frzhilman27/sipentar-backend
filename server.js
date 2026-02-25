const express = require("express");
const cors = require("cors");
const laporanRoutes = require("./routes/laporanRoutes");
const PORT = process.env.PORT || 5000;

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Sipentar Backend Running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});