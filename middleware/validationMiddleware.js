const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Please enter your email or username'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const profileValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 250 })
    .withMessage('Bio cannot exceed 250 characters'),
  body('profilePicture')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
];

const postValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content cannot be empty')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content cannot exceed 2000 characters'),
  body('imageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
];

const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment cannot be empty')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
];

module.exports = {
  registerValidation,
  loginValidation,
  profileValidation,
  postValidation,
  commentValidation,
  validationResult,
};

