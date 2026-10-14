/**
 * authorise
 * ---------
 * Factory function: authorise('admin') or authorise('admin', 'lecturer')
 * Checks req.user.role matches one of the specified roles.
 * Returns 403 'Forbidden' if mismatch.
 */
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = authorise;
