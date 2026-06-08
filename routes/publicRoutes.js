const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

// Mengambil data statistik untuk ditampilkan di beranda
router.get("/stats", publicController.getStats);

// Mengambil daftar pengumuman untuk landing page
router.get("/pengumuman", publicController.getPengumuman);

module.exports = router;
