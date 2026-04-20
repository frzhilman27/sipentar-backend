const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route untuk mengirim pesan ke AI
router.post('/chat', aiController.chat);

module.exports = router;
