const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validationResult } = require('../middleware/validationMiddleware');

// POST /posts/:id/comments - Add Comment
const addComment = async (req, res, next) => {
  const postId = req.params.id;
  const errors = validationResult(req);
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    req.flash('error_msg', 'Invalid post ID');
    return res.redirect('/');
  }

  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect(`/posts/${postId}`);
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }

    const newComment = new Comment({
      post: postId,
      author: req.user._id,
      content: content.trim(),
    });

    await newComment.save();

    req.flash('success_msg', 'Comment posted successfully');
    return res.redirect(`/posts/${postId}`);
  } catch (err) {
    console.error('Add Comment Error:', err);
    return next(err);
  }
};

// POST /posts/:postId/comments/:commentId/delete - Delete Comment
const deleteComment = async (req, res, next) => {
  const { postId, commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
    req.flash('error_msg', 'Invalid post or comment ID');
    return res.redirect('/');
  }

  try {
    const [post, comment] = await Promise.all([
      Post.findById(postId),
      Comment.findById(commentId),
    ]);

    if (!post || !comment) {
      req.flash('error_msg', 'Post or comment not found');
      return res.redirect(`/posts/${postId}`);
    }

    // Authorization check: Comment author OR Post author (moderation)
    const isCommentAuthor = comment.author.equals(req.user._id);
    const isPostAuthor = post.author.equals(req.user._id);

    if (!isCommentAuthor && !isPostAuthor) {
      req.flash('error_msg', 'You are not authorized to delete this comment');
      return res.redirect(`/posts/${postId}`);
    }

    await Comment.findByIdAndDelete(commentId);

    req.flash('success_msg', 'Comment deleted successfully');
    return res.redirect(`/posts/${postId}`);
  } catch (err) {
    console.error('Delete Comment Error:', err);
    return next(err);
  }
};

module.exports = {
  addComment,
  deleteComment,
};

