const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Follow = require('./models/Follow');

const sampleUsers = [
  {
    name: 'Sarah Connor',
    username: 'sarah_c',
    email: 'sarah@pulse.com',
    password: 'password123',
    bio: 'Tech enthusiast, AI explorer, and photography lover. Building the future one commit at a time.',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    name: 'Marcus Vance',
    username: 'marcus_v',
    email: 'marcus@pulse.com',
    password: 'password123',
    bio: 'Senior Full Stack Engineer. Lover of clean code, distributed systems, and specialty coffee.',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    name: 'Elena Rostova',
    username: 'elena_dev',
    email: 'elena@pulse.com',
    password: 'password123',
    bio: 'UI/UX Designer & Frontend artisan. Turning complex workflows into elegant, intuitive experiences.',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_media_platform';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing users from sample list
  for (const u of sampleUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      await Post.deleteMany({ author: existing._id });
      await Follow.deleteMany({ $or: [{ follower: existing._id }, { following: existing._id }] });
      await User.deleteOne({ _id: existing._id });
    }
  }

  // Create users
  const createdUsers = [];
  for (const u of sampleUsers) {
    const user = new User(u);
    await user.save();
    createdUsers.push(user);
    console.log(`Created user: ${user.name} (@${user.username})`);
  }

  const [sarah, marcus, elena] = createdUsers;

  // Create Follows
  await new Follow({ follower: sarah._id, following: marcus._id }).save();
  await new Follow({ follower: sarah._id, following: elena._id }).save();
  await new Follow({ follower: marcus._id, following: sarah._id }).save();
  await new Follow({ follower: elena._id, following: marcus._id }).save();
  console.log('Created follow relationships.');

  // Create Posts
  const p1 = await new Post({
    author: sarah._id,
    content: 'Just launched our new platform built with Express, EJS, and Tailwind CSS! Loving the simplicity and speed of server-rendered apps with modern utility styling. 🚀✨',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    likes: [marcus._id, elena._id],
  }).save();

  const p2 = await new Post({
    author: marcus._id,
    content: 'Architectural tip for the day: Always keep your controllers slim, models focused, and security headers strict. Production readiness starts from line one.',
    imageUrl: '',
    likes: [sarah._id],
  }).save();

  const p3 = await new Post({
    author: elena._id,
    content: 'Exploring the new Tailwind CSS design system tokens. Soft borders, balanced typography, and clean contrast make all the difference.',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    likes: [sarah._id, marcus._id],
  }).save();

  console.log('Created sample posts.');

  // Create Comments
  await new Comment({
    post: p1._id,
    author: marcus._id,
    content: 'Looks incredible, Sarah! The responsive layout is super smooth.',
  }).save();

  await new Comment({
    post: p1._id,
    author: elena._id,
    content: 'Congratulations! Love the typography and clean light mode colors.',
  }).save();

  await new Comment({
    post: p2._id,
    author: sarah._id,
    content: '100% agreed! Defense-in-depth is the way.',
  }).save();

  console.log('Created sample comments.');
  console.log('\nSeeding completed successfully!');
  console.log('You can log in with:');
  console.log('  Email: sarah@pulse.com (Password: password123)');
  console.log('  Email: marcus@pulse.com (Password: password123)');
  console.log('  Email: elena@pulse.com (Password: password123)');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

