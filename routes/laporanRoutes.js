const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// Apply upload.array('media', 5) to parse multipart/form-data for the 'media' field
router.post("/", auth, upload.array('media', 5), laporanController.createLaporan);
router.get("/", auth, laporanController.getAllLaporan);
router.put("/:id/status", auth, upload.array('admin_media', 5), laporanController.updateStatus);
router.delete("/:id", auth, laporanController.deleteLaporan);
router.get("/:id/history", auth, laporanController.getLaporanHistory);

module.exports = router;