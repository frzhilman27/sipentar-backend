const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// Route untuk mengirim pesan ke AI — memerlukan autentikasi
router.post('/chat', authMiddleware, aiController.chat);

// Route untuk validasi foto — memerlukan autentikasi
router.post('/validate-photo', authMiddleware, aiController.validatePhoto);

module.exports = router;
