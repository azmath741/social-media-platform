const User = require('../models/User');

// Require authentication for protected routes
const ensureAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view that resource');
  return res.redirect('/login');
};

// Require guest for login/register routes
const ensureGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Attach current user to req and res.locals
const attachCurrentUser = async (req, res, next) => {
  res.locals.currentUser = null;
  req.user = null;

  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
      } else {
        // User session exists but user deleted from DB
        req.session.destroy();
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  }
  next();
};

module.exports = {
  ensureAuth,
  ensureGuest,
  attachCurrentUser,
};

