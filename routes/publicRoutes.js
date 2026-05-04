const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

// Mengambil data statistik untuk ditampilkan di beranda
router.get("/stats", publicController.getStats);

module.exports = router;
