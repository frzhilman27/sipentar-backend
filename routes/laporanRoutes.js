const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// Apply upload.single('image') to parse multipart/form-data for the 'image' field
router.post("/", auth, laporanController.createLaporan);
router.get("/", auth, laporanController.getAllLaporan);
router.put("/:id/status", auth, laporanController.updateStatus);
router.delete("/:id", auth, laporanController.deleteLaporan);
router.get("/:id/history", auth, laporanController.getLaporanHistory);

module.exports = router;