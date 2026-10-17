const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { ensureAuth } = require('../middleware/authMiddleware');
const { postValidation } = require('../middleware/validationMiddleware');

// Home Feed
router.get('/', ensureAuth, postController.getHomeFeed);

// Create post
router.post('/posts', ensureAuth, postValidation, postController.createPost);

// View post details
router.get('/posts/:id', ensureAuth, postController.getPostDetail);

// Edit post
router.get('/posts/:id/edit', ensureAuth, postController.getEditPost);
router.post('/posts/:id/edit', ensureAuth, postValidation, postController.postEditPost);

// Delete post
router.post('/posts/:id/delete', ensureAuth, postController.deletePost);

// Like and Unlike
router.post('/posts/:id/like', ensureAuth, postController.likePost);
router.post('/posts/:id/unlike', ensureAuth, postController.unlikePost);

module.exports = router;

