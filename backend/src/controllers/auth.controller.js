const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * login
 * -----
 * POST /api/auth/login
 * - Find user by email → bcrypt.compare password
 * - jwt.sign → save as activeToken → return token + role
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  user.activeToken = token;
  await user.save();

  return res.status(200).json({
    token,
    role: user.role,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      matricNo: user.matricNo,
      department: user.department,
      level: user.level,
    },
  });
};

/**
 * logout
 * ------
 * POST /api/auth/logout
 * Protected: JWT required
 * - Set user.activeToken = null → save → 200
 */
const logout = async (req, res) => {
  req.user.activeToken = null;
  await req.user.save();

  return res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * getMe
 * -----
 * GET /api/auth/me
 * Protected: JWT required
 * - Return req.user (set by protect middleware)
 */
const getMe = async (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  delete user.activeToken;
  return res.status(200).json(user);
};

module.exports = {
  login,
  logout,
  getMe,
};
