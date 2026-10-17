const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower is required'],
      index: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User being followed is required'],
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index to prevent duplicate follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Pre-save validation: prevent self-follow
followSchema.pre('save', function (next) {
  if (this.follower.toString() === this.following.toString()) {
    const err = new Error('You cannot follow yourself');
    return next(err);
  }
  next();
});

const Follow = mongoose.model('Follow', followSchema);
module.exports = Follow;

