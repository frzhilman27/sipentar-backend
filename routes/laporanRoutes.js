const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({
  storage: storage,
});

/* =========================
   ROUTES
========================= */

// contoh route upload
router.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

module.exports = router;