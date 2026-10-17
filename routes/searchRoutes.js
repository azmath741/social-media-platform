const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuth } = require('../middleware/authMiddleware');

// Search users
router.get('/search', ensureAuth, userController.searchUsers);

module.exports = router;

