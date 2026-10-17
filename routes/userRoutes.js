const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const followController = require('../controllers/followController');
const { ensureAuth } = require('../middleware/authMiddleware');
const { profileValidation } = require('../middleware/validationMiddleware');

// User profile shortcuts
router.get('/profile', ensureAuth, userController.getMyProfile);
router.get('/profile/edit', ensureAuth, userController.getEditProfile);
router.post('/profile/edit', ensureAuth, profileValidation, userController.postEditProfile);

// Specific user profile
router.get('/users/:username', ensureAuth, userController.getUserProfile);

// Followers and Following lists
router.get('/users/:username/followers', ensureAuth, followController.getFollowers);
router.get('/users/:username/following', ensureAuth, followController.getFollowing);

// Follow and Unfollow actions
router.post('/users/:id/follow', ensureAuth, followController.postFollow);
router.post('/users/:id/unfollow', ensureAuth, followController.postUnfollow);

module.exports = router;

