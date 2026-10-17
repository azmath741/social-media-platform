const crypto = require('crypto');

const csrfProtection = (req, res, next) => {
  // Ensure session exists
  if (!req.session) {
    return next(new Error('Session is required for CSRF protection'));
  }

  // Generate CSRF token if not already in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Make token available to templates and responses
  res.locals.csrfToken = req.session.csrfToken;

  // Safe HTTP methods do not require CSRF token validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Check token for state-modifying requests
  const clientToken =
    (req.body && req.body._csrf) ||
    req.headers['x-csrf-token'] ||
    req.headers['csrf-token'] ||
    (req.query && req.query._csrf);

  if (!clientToken || clientToken !== req.session.csrfToken) {
    const isAjax =
      req.xhr ||
      (req.headers['accept'] && req.headers['accept'].includes('application/json')) ||
      (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

    if (isAjax) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token. Please refresh the page.',
      });
    }

    req.flash('error_msg', 'Invalid or expired security token. Please try submitting again.');
    return res.status(403).redirect('back');
  }

  next();
};

module.exports = csrfProtection;

