const User = require('../models/User');
const { validationResult } = require('../middleware/validationMiddleware');

// GET /register
const getRegister = (req, res) => {
  res.render('register', {
    title: 'Create an Account',
    oldInput: {},
    errors: [],
  });
};

// POST /register
const postRegister = async (req, res, next) => {
  const errors = validationResult(req);
  const { name, username, email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.render('register', {
      title: 'Create an Account',
      errors: errors.array(),
      oldInput: { name, username, email },
    });
  }

  try {
    // Check if email already registered
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.render('register', {
        title: 'Create an Account',
        errors: [{ msg: 'An account with that email already exists' }],
        oldInput: { name, username, email },
      });
    }

    // Check if username already taken
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.render('register', {
        title: 'Create an Account',
        errors: [{ msg: 'Username is already taken. Please choose another.' }],
        oldInput: { name, username, email },
      });
    }

    // Create user
    const user = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    req.flash('success_msg', 'Account created successfully! Please sign in with your credentials.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Registration Error:', err);
    return next(err);
  }
};

// GET /login
const getLogin = (req, res) => {
  res.render('login', {
    title: 'Sign In',
    oldInput: {},
    errors: [],
  });
};

// POST /login
const postLogin = async (req, res, next) => {
  const errors = validationResult(req);
  const { identifier, password } = req.body;

  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Sign In',
      errors: errors.array(),
      oldInput: { identifier },
    });
  }

  try {
    const trimmedId = identifier.trim().toLowerCase();
    // Search user by email or username
    const user = await User.findOne({
      $or: [{ email: trimmedId }, { username: trimmedId }],
    });

    if (!user) {
      return res.render('login', {
        title: 'Sign In',
        errors: [{ msg: 'Invalid username/email or password' }],
        oldInput: { identifier },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Sign In',
        errors: [{ msg: 'Invalid username/email or password' }],
        oldInput: { identifier },
      });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user._id;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);

        req.flash('success_msg', `Welcome back, ${user.name}!`);
        return res.redirect('/');
      });
    });
  } catch (err) {
    console.error('Login Error:', err);
    return next(err);
  }
};

// POST /logout
const postLogout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout Error:', err);
      }
      res.clearCookie('connect.sid');
      return res.redirect('/login');
    });
  } else {
    return res.redirect('/login');
  }
};

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout,
};

