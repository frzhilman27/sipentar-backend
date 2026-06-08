const express = require("express");
const router = express.Router();
const suratController = require("../controllers/suratController");
const auth = require("../middleware/auth");

// Warga: buat pengajuan surat baru
router.post("/", auth, suratController.createSurat);

// Warga & Admin: ambil daftar surat
router.get("/", auth, suratController.getAllSurat);

// Admin: update status surat
router.put("/:id/status", auth, suratController.updateStatusSurat);

// Admin: hapus surat
router.delete("/:id", auth, suratController.deleteSurat);

module.exports = router;
