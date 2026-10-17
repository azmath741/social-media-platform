const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const User = require('../models/User');

// POST /users/:id/follow
const postFollow = async (req, res, next) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    req.flash('error_msg', 'Invalid user ID');
    return res.redirect('back');
  }

  if (currentUserId.toString() === targetId.toString()) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }
    req.flash('error_msg', 'You cannot follow yourself');
    return res.redirect('back');
  }

  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      req.flash('error_msg', 'User not found');
      return res.redirect('back');
    }

    // Attempt to create follow or ignore duplicate
    await Follow.findOneAndUpdate(
      { follower: currentUserId, following: targetId },
      { $setOnInsert: { follower: currentUserId, following: targetId, createdAt: new Date() } },
      { upsert: true, new: true }
    );

    const followersCount = await Follow.countDocuments({ following: targetId });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        isFollowing: true,
        followersCount,
        message: `You are now following ${targetUser.name}`,
      });
    }

    req.flash('success_msg', `You are now following ${targetUser.name}`);
    return res.redirect('back');
  } catch (err) {
    console.error('Follow Error:', err);
    return next(err);
  }
};

// POST /users/:id/unfollow
const postUnfollow = async (req, res, next) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    req.flash('error_msg', 'Invalid user ID');
    return res.redirect('back');
  }

  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      req.flash('error_msg', 'User not found');
      return res.redirect('back');
    }

    await Follow.findOneAndDelete({ follower: currentUserId, following: targetId });

    const followersCount = await Follow.countDocuments({ following: targetId });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        isFollowing: false,
        followersCount,
        message: `Unfollowed ${targetUser.name}`,
      });
    }

    req.flash('success_msg', `Unfollowed ${targetUser.name}`);
    return res.redirect('back');
  } catch (err) {
    console.error('Unfollow Error:', err);
    return next(err);
  }
};

// GET /users/:username/followers
const getFollowers = async (req, res, next) => {
  try {
    const profileUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!profileUser) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }

    const followDocs = await Follow.find({ following: profileUser._id })
      .populate('follower', 'name username bio profilePicture')
      .sort({ createdAt: -1 });

    const followersList = followDocs.map((doc) => doc.follower).filter(Boolean);

    // Get IDs of users current user is following
    const currentFollowingDocs = await Follow.find({ follower: req.user._id }).select('following');
    const currentFollowingSet = new Set(
      currentFollowingDocs.map((doc) => doc.following.toString())
    );

    const followersWithStatus = followersList.map((user) => ({
      ...user.toObject(),
      isFollowing: currentFollowingSet.has(user._id.toString()),
      isSelf: req.user._id.equals(user._id),
    }));

    res.render('followers', {
      title: `${profileUser.name} (@${profileUser.username}) - Followers`,
      profileUser,
      followers: followersWithStatus,
    });
  } catch (err) {
    console.error('Get Followers Error:', err);
    return next(err);
  }
};

// GET /users/:username/following
const getFollowing = async (req, res, next) => {
  try {
    const profileUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!profileUser) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }

    const followDocs = await Follow.find({ follower: profileUser._id })
      .populate('following', 'name username bio profilePicture')
      .sort({ createdAt: -1 });

    const followingList = followDocs.map((doc) => doc.following).filter(Boolean);

    // Get IDs of users current user is following
    const currentFollowingDocs = await Follow.find({ follower: req.user._id }).select('following');
    const currentFollowingSet = new Set(
      currentFollowingDocs.map((doc) => doc.following.toString())
    );

    const followingWithStatus = followingList.map((user) => ({
      ...user.toObject(),
      isFollowing: currentFollowingSet.has(user._id.toString()),
      isSelf: req.user._id.equals(user._id),
    }));

    res.render('following', {
      title: `${profileUser.name} (@${profileUser.username}) - Following`,
      profileUser,
      following: followingWithStatus,
    });
  } catch (err) {
    console.error('Get Following Error:', err);
    return next(err);
  }
};

module.exports = {
  postFollow,
  postUnfollow,
  getFollowers,
  getFollowing,
};

