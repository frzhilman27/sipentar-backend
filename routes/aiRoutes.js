const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route untuk mengirim pesan ke AI
router.post('/chat', aiController.chat);

// Route untuk validasi foto
router.post('/validate-photo', aiController.validatePhoto);

module.exports = router;
