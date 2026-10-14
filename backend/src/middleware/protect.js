const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect
 * -------
 * 1. Extract Bearer token from Authorization header
 * 2. jwt.verify(token, JWT_SECRET) → decode { id, role }
 * 3. User.findById(id).select('+activeToken')
 * 4. If user.activeToken !== token → 401 'Session expired'
 * 5. req.user = user; next()
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorised, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+activeToken');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.activeToken !== token) {
      return res.status(401).json({ message: 'Session expired' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised, token invalid or expired' });
  }
};

module.exports = protect;
