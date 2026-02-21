const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // If no token, return 401 Unauthorized
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Skip user lookup if DB is not connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable' });
    }
    
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    // Return 401 on token error
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
