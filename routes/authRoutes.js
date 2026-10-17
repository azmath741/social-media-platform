const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { ensureGuest, ensureAuth } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validationMiddleware');

// Rate limiter for authentication routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login or registration attempts from this IP, please try again after 15 minutes.',
  handler: (req, res, next, options) => {
    req.flash('error_msg', options.message);
    res.redirect(req.originalUrl.includes('register') ? '/register' : '/login');
  },
});

// Register
router.get('/register', ensureGuest, authController.getRegister);
router.post('/register', ensureGuest, authLimiter, registerValidation, authController.postRegister);

// Login
router.get('/login', ensureGuest, authController.getLogin);
router.post('/login', ensureGuest, authLimiter, loginValidation, authController.postLogin);

// Logout
router.post('/logout', ensureAuth, authController.postLogout);

module.exports = router;

