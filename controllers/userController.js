const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { validationResult } = require('../middleware/validationMiddleware');

// GET /profile -> redirect to /users/:username
const getMyProfile = (req, res) => {
  return res.redirect(`/users/${req.user.username}`);
};

// GET /users/:username
const getUserProfile = async (req, res, next) => {
  try {
    const username = req.params.username.toLowerCase();
    const profileUser = await User.findOne({ username });

    if (!profileUser) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }

    const isOwnProfile = req.user && req.user._id.equals(profileUser._id);

    // Fetch counts and relationship
    const [postsCount, followersCount, followingCount, isFollowing, posts] = await Promise.all([
      Post.countDocuments({ author: profileUser._id }),
      Follow.countDocuments({ following: profileUser._id }),
      Follow.countDocuments({ follower: profileUser._id }),
      req.user
        ? Follow.exists({ follower: req.user._id, following: profileUser._id })
        : Promise.resolve(false),
      Post.find({ author: profileUser._id })
        .populate('author', 'name username profilePicture')
        .sort({ createdAt: -1 }),
    ]);

    res.render('profile', {
      title: `${profileUser.name} (@${profileUser.username})`,
      profileUser,
      isOwnProfile,
      isFollowing: !!isFollowing,
      postsCount,
      followersCount,
      followingCount,
      posts,
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return next(err);
  }
};

// GET /profile/edit
const getEditProfile = (req, res) => {
  res.render('edit-profile', {
    title: 'Edit Profile',
    user: req.user,
    errors: [],
  });
};

// POST /profile/edit
const postEditProfile = async (req, res, next) => {
  const errors = validationResult(req);
  const { name, bio, profilePicture } = req.body;

  if (!errors.isEmpty()) {
    return res.render('edit-profile', {
      title: 'Edit Profile',
      user: { ...req.user.toObject(), name, bio, profilePicture },
      errors: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/login');
    }

    user.name = name.trim();
    user.bio = bio ? bio.trim() : '';
    if (profilePicture && profilePicture.trim()) {
      user.profilePicture = profilePicture.trim();
    } else {
      user.profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=6366f1&color=fff&bold=true`;
    }

    await user.save();

    req.flash('success_msg', 'Your profile has been updated successfully!');
    return res.redirect(`/users/${user.username}`);
  } catch (err) {
    console.error('Edit Profile Error:', err);
    return next(err);
  }
};

// GET /search
const searchUsers = async (req, res, next) => {
  const query = (req.query.q || '').trim();

  try {
    let users = [];
    if (query) {
      // Escape regex special characters to prevent regex injection
      const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      users = await User.find({
        $or: [
          { name: { $regex: sanitizedQuery, $options: 'i' } },
          { username: { $regex: sanitizedQuery, $options: 'i' } },
        ],
        _id: { $ne: req.user._id }, // exclude self from search
      })
        .select('name username bio profilePicture')
        .limit(20);

      // Check following status for each user
      const followingDocs = await Follow.find({ follower: req.user._id }).select('following');
      const followingSet = new Set(followingDocs.map((doc) => doc.following.toString()));

      users = users.map((u) => ({
        ...u.toObject(),
        isFollowing: followingSet.has(u._id.toString()),
      }));
    }

    res.render('search', {
      title: query ? `Search: ${query}` : 'Search Users',
      query,
      results: users,
    });
  } catch (err) {
    console.error('Search Users Error:', err);
    return next(err);
  }
};

module.exports = {
  getMyProfile,
  getUserProfile,
  getEditProfile,
  postEditProfile,
  searchUsers,
};

