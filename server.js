require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import User Model
require("./models/User");

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

app.use(
  cors({
    origin: "*", // nanti bisa diganti dengan URL frontend kamu
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// =====================
// DATABASE CONNECTION
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });

// =====================
// ROUTES
// =====================

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "SIPENTAR API is running 🚀",
  });
});

// Example Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "API Working Fine ✅" });
});

// =====================
// ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

// =====================
// START SERVER (RAILWAY FIX)
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});