const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // If no token, continue without user (for development)
    if (!token) {
      req.user = { id: null };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      req.user = { id: null };
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // Continue without user on token error (for development)
    req.user = { id: null };
    next();
  }
};

module.exports = auth;
