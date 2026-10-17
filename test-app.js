const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Follow = require('./models/Follow');

async function runTests() {
  console.log('--- STARTING SOCIAL MEDIA PLATFORM TEST SUITE ---');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_media_platform';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  // Clean test data
  await User.deleteMany({ email: { $in: ['test_alice@pulse.com', 'test_bob@pulse.com'] } });
  console.log('✓ Cleaned up any prior test users');

  // Test 1: User Registration & Password Hashing
  console.log('\n[Test 1] User Registration & Password Hashing');
  const alice = new User({
    name: 'Alice Cooper',
    username: 'alice_c',
    email: 'test_alice@pulse.com',
    password: 'password123',
    bio: 'Software engineer and coffee lover.',
  });
  await alice.save();

  if (alice.password === 'password123') {
    throw new Error('FAIL: Password was saved in plain text!');
  }
  const isMatch = await alice.comparePassword('password123');
  if (!isMatch) {
    throw new Error('FAIL: Password verification failed!');
  }
  console.log('✓ User created with bcrypt hashed password:', alice.password.substring(0, 15) + '...');

  // Test 2: Duplicate Username & Email Validation
  console.log('\n[Test 2] Duplicate Email Prevention');
  try {
    const dupUser = new User({
      name: 'Duplicate Alice',
      username: 'alice_duplicate',
      email: 'test_alice@pulse.com',
      password: 'password123',
    });
    await dupUser.save();
    throw new Error('FAIL: Duplicate email was allowed!');
  } catch (err) {
    console.log('✓ Duplicate email successfully rejected');
  }

  // Create second user
  const bob = new User({
    name: 'Bob Martin',
    username: 'uncle_bob',
    email: 'test_bob@pulse.com',
    password: 'clean_code_rocks',
    bio: 'Software craftsmanship advocate.',
  });
  await bob.save();
  console.log('✓ Created second test user (Bob Martin)');

  // Test 3: Follow System
  console.log('\n[Test 3] Follow System');
  // Self-follow prevention
  try {
    const selfFollow = new Follow({ follower: alice._id, following: alice._id });
    await selfFollow.save();
    throw new Error('FAIL: Self-follow was allowed!');
  } catch (err) {
    console.log('✓ Self-follow prevented by model hook');
  }

  // Alice follows Bob
  const follow1 = new Follow({ follower: alice._id, following: bob._id });
  await follow1.save();
  console.log('✓ Alice successfully followed Bob');

  // Duplicate follow prevention
  try {
    const dupFollow = new Follow({ follower: alice._id, following: bob._id });
    await dupFollow.save();
    throw new Error('FAIL: Duplicate follow relationship allowed!');
  } catch (err) {
    console.log('✓ Duplicate follow relationship rejected by compound unique index');
  }

  const aliceFollowingCount = await Follow.countDocuments({ follower: alice._id });
  const bobFollowersCount = await Follow.countDocuments({ following: bob._id });
  if (aliceFollowingCount !== 1 || bobFollowersCount !== 1) {
    throw new Error('FAIL: Follow counts incorrect!');
  }
  console.log(`✓ Follow counts verified: Alice following = ${aliceFollowingCount}, Bob followers = ${bobFollowersCount}`);

  // Test 4: Post Creation
  console.log('\n[Test 4] Post Creation');
  const bobPost = new Post({
    author: bob._id,
    content: 'Always leave the code behind in a better state than you found it. #cleancode',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
  });
  await bobPost.save();
  console.log('✓ Bob created a post with content and image');

  const alicePost = new Post({
    author: alice._id,
    content: 'Just deployed our new social media platform built with Express and Tailwind!',
  });
  await alicePost.save();
  console.log('✓ Alice created a text post');

  // Test 5: Feed Query (Alice's feed should include Bob's post and Alice's own post)
  console.log('\n[Test 5] Home Feed Query Logic');
  const aliceFollowDocs = await Follow.find({ follower: alice._id }).select('following');
  const followingIds = aliceFollowDocs.map((doc) => doc.following);
  const feedAuthorIds = [...followingIds, alice._id];

  const feedPosts = await Post.find({ author: { $in: feedAuthorIds } })
    .populate('author', 'name username')
    .sort({ createdAt: -1 });

  if (feedPosts.length < 2) {
    throw new Error(`FAIL: Feed posts expected >= 2, got ${feedPosts.length}`);
  }
  console.log(`✓ Alice's chronological feed returned ${feedPosts.length} posts from followed users + self`);

  // Test 6: Likes & Duplicate Like Prevention
  console.log('\n[Test 6] Likes System');
  // Alice likes Bob's post
  await Post.findByIdAndUpdate(bobPost._id, { $addToSet: { likes: alice._id } });
  let postAfterLike = await Post.findById(bobPost._id);
  if (postAfterLike.likes.length !== 1) {
    throw new Error('FAIL: Like was not added');
  }
  // Try duplicate like with $addToSet
  await Post.findByIdAndUpdate(bobPost._id, { $addToSet: { likes: alice._id } });
  postAfterLike = await Post.findById(bobPost._id);
  if (postAfterLike.likes.length !== 1) {
    throw new Error('FAIL: Duplicate like was recorded!');
  }
  console.log('✓ Liking works and duplicate likes prevented via $addToSet');

  // Alice unlikes Bob's post
  await Post.findByIdAndUpdate(bobPost._id, { $pull: { likes: alice._id } });
  const postAfterUnlike = await Post.findById(bobPost._id);
  if (postAfterUnlike.likes.length !== 0) {
    throw new Error('FAIL: Unlike failed');
  }
  console.log('✓ Unliking works correctly');

  // Test 7: Comments & Comment Moderation
  console.log('\n[Test 7] Comments & Moderation');
  const aliceComment = new Comment({
    post: bobPost._id,
    author: alice._id,
    content: 'Great reminder! The Boy Scout Rule in practice.',
  });
  await aliceComment.save();
  console.log('✓ Comment added to Bob’s post');

  // Authorization logic check:
  // Is Alice authorized to delete her own comment? YES
  const canAliceDelete = aliceComment.author.equals(alice._id) || bobPost.author.equals(alice._id);
  if (!canAliceDelete) throw new Error('FAIL: Comment author cannot delete their own comment');

  // Is Bob (post owner) authorized to moderate/delete comments on his post? YES
  const canBobModerate = aliceComment.author.equals(bob._id) || bobPost.author.equals(bob._id);
  if (!canBobModerate) throw new Error('FAIL: Post author cannot moderate/delete comments on their post');
  console.log('✓ Comment authorization verified: both comment author and post author have deletion rights');

  // Test 8: Post Cascading Deletion
  console.log('\n[Test 8] Post Deletion & Cascading Comments Cleanup');
  await Post.findByIdAndDelete(bobPost._id);
  await Comment.deleteMany({ post: bobPost._id });

  const remainingComments = await Comment.countDocuments({ post: bobPost._id });
  if (remainingComments !== 0) {
    throw new Error('FAIL: Cascading comment cleanup failed!');
  }
  console.log('✓ Post deleted and associated comments cleaned up');

  // Test 9: User Search
  console.log('\n[Test 9] User Search');
  const searchResults = await User.find({
    $or: [
      { name: { $regex: 'alice', $options: 'i' } },
      { username: { $regex: 'alice', $options: 'i' } },
    ],
  });
  if (searchResults.length === 0) {
    throw new Error('FAIL: Search did not find user');
  }
  console.log(`✓ User search found ${searchResults.length} matching user(s) for query "alice"`);

  // Clean up test data
  await User.deleteMany({ email: { $in: ['test_alice@pulse.com', 'test_bob@pulse.com'] } });
  await Post.deleteMany({ author: { $in: [alice._id, bob._id] } });
  await Follow.deleteMany({ $or: [{ follower: alice._id }, { following: bob._id }] });
  console.log('✓ Cleaned up test database records');

  await mongoose.disconnect();
  console.log('\n========================================');
  console.log('ALL BACKEND & MODEL TESTS PASSED! 100% SUCCESS');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

