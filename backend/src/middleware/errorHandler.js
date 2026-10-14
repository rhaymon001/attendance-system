/**
 * errorHandler
 * ------------
 * Global Express error handling middleware.
 * Standardizes API responses across validation failures, casting errors,
 * duplicate database keys, and unhandled server errors.
 */
const errorHandler = (err, req, res, next) => {
  // Log internal errors for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.stack || err);
  }

  // Handle Mongoose Invalid ObjectId CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path || 'ID'} format`,
      reason: 'invalid_id',
    });
  }

  // Handle Mongoose Schema Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: messages[0] || 'Validation error',
      reason: 'validation_error',
      errors: messages,
    });
  }

  // Handle MongoDB Duplicate Key Conflict
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      message: `A record with this ${field} already exists`,
      reason: 'duplicate_key',
    });
  }

  // Handle JWT Malformed or Expired
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Not authorised, token invalid or expired',
      reason: 'invalid_token',
    });
  }

  // Handle Custom Status Codes or Generic 500
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  return res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    reason: err.reason || 'server_error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
