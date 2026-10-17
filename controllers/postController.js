const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const User = require('../models/User');
const { validationResult } = require('../middleware/validationMiddleware');

// GET / - Home Feed
const getHomeFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 8;
    const skip = (page - 1) * limit;

    // Current user's following IDs
    const followDocs = await Follow.find({ follower: req.user._id }).select('following');
    const followingIds = followDocs.map((doc) => doc.following);
    // Feed authors: users being followed + current user
    const feedAuthorIds = [...followingIds, req.user._id];

    // Count user's stats for left sidebar
    const [userPostsCount, userFollowersCount, userFollowingCount] = await Promise.all([
      Post.countDocuments({ author: req.user._id }),
      Follow.countDocuments({ following: req.user._id }),
      Follow.countDocuments({ follower: req.user._id }),
    ]);

    // Query posts
    let totalPosts = await Post.countDocuments({ author: { $in: feedAuthorIds } });
    let isFallbackFeed = false;
    let queryFilter = { author: { $in: feedAuthorIds } };

    // Fallback: If feed is empty and user follows nobody (or followed users haven't posted),
    // show recent global community posts so the feed is lively and not a blank dead end!
    if (totalPosts === 0 && followingIds.length === 0) {
      totalPosts = await Post.countDocuments();
      queryFilter = {};
      isFallbackFeed = true;
    }

    const postsData = await Post.find(queryFilter)
      .populate('author', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get comment counts for these posts
    const postIds = postsData.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const commentCountMap = {};
    commentCounts.forEach((c) => {
      commentCountMap[c._id.toString()] = c.count;
    });

    const posts = postsData.map((p) => {
      const isLiked = p.likes.some((id) => id.toString() === req.user._id.toString());
      return {
        ...p.toObject(),
        commentCount: commentCountMap[p._id.toString()] || 0,
        isLiked,
        isOwner: p.author && p.author._id.toString() === req.user._id.toString(),
      };
    });

    // Suggested users: users not followed yet, excluding current user
    const suggestedUsers = await User.find({
      _id: { $nin: [...followingIds, req.user._id] },
    })
      .select('name username bio profilePicture')
      .limit(5);

    const totalPages = Math.ceil(totalPosts / limit) || 1;

    res.render('home', {
      title: 'Home / Feed',
      posts,
      currentPage: page,
      totalPages,
      totalPosts,
      isFallbackFeed,
      suggestedUsers,
      userStats: {
        postsCount: userPostsCount,
        followersCount: userFollowersCount,
        followingCount: userFollowingCount,
      },
    });
  } catch (err) {
    console.error('Home Feed Error:', err);
    return next(err);
  }
};

// POST /posts - Create Post
const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  const { content, imageUrl } = req.body;

  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect('/');
  }

  try {
    const newPost = new Post({
      author: req.user._id,
      content: content.trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : '',
    });

    await newPost.save();
    req.flash('success_msg', 'Your post has been published!');
    return res.redirect('/');
  } catch (err) {
    console.error('Create Post Error:', err);
    return next(err);
  }
};

// GET /posts/:id - Post Detail View
const getPostDetail = async (req, res, next) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    req.flash('error_msg', 'Invalid post ID');
    return res.redirect('/');
  }

  try {
    const post = await Post.findById(postId).populate(
      'author',
      'name username profilePicture'
    );

    if (!post) {
      req.flash('error_msg', 'Post not found or has been deleted');
      return res.redirect('/');
    }

    const commentsData = await Comment.find({ post: postId })
      .populate('author', 'name username profilePicture')
      .sort({ createdAt: 1 });

    const isPostOwner = req.user && post.author && post.author._id.equals(req.user._id);
    const isLiked = req.user && post.likes.some((id) => id.equals(req.user._id));

    // Can current user moderate comment? Yes if comment author OR post owner
    const comments = commentsData.map((c) => ({
      ...c.toObject(),
      canDelete:
        req.user &&
        (c.author._id.equals(req.user._id) || isPostOwner),
    }));

    res.render('post-detail', {
      title: `Post by ${post.author ? post.author.name : 'Unknown'}`,
      post: {
        ...post.toObject(),
        isLiked,
        isOwner: isPostOwner,
        commentCount: comments.length,
      },
      comments,
    });
  } catch (err) {
    console.error('Get Post Detail Error:', err);
    return next(err);
  }
};

// GET /posts/:id/edit
const getEditPost = async (req, res, next) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    req.flash('error_msg', 'Invalid post ID');
    return res.redirect('/');
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }

    if (!post.author.equals(req.user._id)) {
      req.flash('error_msg', 'You are not authorized to edit this post');
      return res.redirect(`/posts/${postId}`);
    }

    res.render('edit-profile', {
      title: 'Edit Post',
      // or we can dedicate a view or handle via modal/edit-post view
    });
  } catch (err) {
    console.error('Get Edit Post Error:', err);
    return next(err);
  }
};

// POST /posts/:id/edit
const postEditPost = async (req, res, next) => {
  const postId = req.params.id;
  const errors = validationResult(req);
  const { content, imageUrl } = req.body;

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

    if (!post.author.equals(req.user._id)) {
      req.flash('error_msg', 'You are not authorized to edit this post');
      return res.redirect(`/posts/${postId}`);
    }

    post.content = content.trim();
    post.imageUrl = imageUrl && imageUrl.trim() ? imageUrl.trim() : '';

    await post.save();
    req.flash('success_msg', 'Post updated successfully!');
    return res.redirect(`/posts/${postId}`);
  } catch (err) {
    console.error('Edit Post Error:', err);
    return next(err);
  }
};

// POST /posts/:id/delete
const deletePost = async (req, res, next) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    req.flash('error_msg', 'Invalid post ID');
    return res.redirect('/');
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }

    if (!post.author.equals(req.user._id)) {
      req.flash('error_msg', 'You are not authorized to delete this post');
      return res.redirect(`/posts/${postId}`);
    }

    // Delete post and its related comments
    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });

    req.flash('success_msg', 'Post and associated comments deleted successfully');
    return res.redirect('/');
  } catch (err) {
    console.error('Delete Post Error:', err);
    return next(err);
  }
};

// POST /posts/:id/like
const likePost = async (req, res, next) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }
    req.flash('error_msg', 'Invalid post ID');
    return res.redirect('back');
  }

  try {
    // Add to likes array safely without duplicates
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );

    if (!updatedPost) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      req.flash('error_msg', 'Post not found');
      return res.redirect('back');
    }

    const likeCount = updatedPost.likes.length;

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        isLiked: true,
        likeCount,
      });
    }

    return res.redirect('back');
  } catch (err) {
    console.error('Like Post Error:', err);
    return next(err);
  }
};

// POST /posts/:id/unlike
const unlikePost = async (req, res, next) => {
  const postId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }
    req.flash('error_msg', 'Invalid post ID');
    return res.redirect('back');
  }

  try {
    // Remove from likes array safely
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: req.user._id } },
      { new: true }
    );

    if (!updatedPost) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      req.flash('error_msg', 'Post not found');
      return res.redirect('back');
    }

    const likeCount = updatedPost.likes.length;

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        isLiked: false,
        likeCount,
      });
    }

    return res.redirect('back');
  } catch (err) {
    console.error('Unlike Post Error:', err);
    return next(err);
  }
};

module.exports = {
  getHomeFeed,
  createPost,
  getPostDetail,
  getEditPost,
  postEditPost,
  deletePost,
  likePost,
  unlikePost,
};

