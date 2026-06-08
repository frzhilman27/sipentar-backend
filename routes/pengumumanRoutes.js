const express = require("express");
const router = express.Router();
const pengumumanController = require("../controllers/pengumumanController");
const authMiddleware = require("../middleware/auth");

// Semua rute ini hanya bisa diakses oleh admin
router.use(authMiddleware);

// Middleware untuk memastikan hanya admin yang bisa mengelola
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak. Khusus admin." });
  }
  next();
};

router.get("/", requireAdmin, pengumumanController.getAllPengumuman);
router.post("/", requireAdmin, pengumumanController.createPengumuman);
router.put("/:id", requireAdmin, pengumumanController.updatePengumuman);
router.delete("/:id", requireAdmin, pengumumanController.deletePengumuman);

module.exports = router;
