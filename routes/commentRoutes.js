const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { ensureAuth } = require('../middleware/authMiddleware');
const { commentValidation } = require('../middleware/validationMiddleware');

// Add comment to a post
router.post('/posts/:id/comments', ensureAuth, commentValidation, commentController.addComment);

// Delete comment
router.post(
  '/posts/:postId/comments/:commentId/delete',
  ensureAuth,
  commentController.deleteComment
);

module.exports = router;

