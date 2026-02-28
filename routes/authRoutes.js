const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { register, login, updateEmail, updatePassword, updateProfileInfo, getMe, deleteAccount } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.put("/profile/email", authMiddleware, updateEmail);
router.put("/profile/password", authMiddleware, updatePassword);
router.put("/profile/info", authMiddleware, upload.single("foto_profil"), updateProfileInfo);
router.delete("/profile", authMiddleware, deleteAccount);

module.exports = router;