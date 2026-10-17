// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist or has been moved.',
  });
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).render('error', {
    title: `${statusCode} - Something went wrong`,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

