const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Vercel only allows writing to /tmp
const uploadDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../uploads");
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Batas 50MB per file untuk mendukung video
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|webp|mp4|webm|ogg/;
        const extname = fileTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("Hanya diperbolehkan format gambar (JPG/PNG/WEBP) dan video (MP4/WEBM/OGG)!"));
        }
    },
});

module.exports = upload;
