const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const connectDB = require('../config/db');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// Helper function to check if DB is connected
const isDBConnected = () => mongoose.connection.readyState === 1;

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    authProvider: 'local'
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
      token: generateToken(user._id)
    });
  }
}));

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  // Only allow local authentication
  if (user && user.authProvider !== 'local') {
    return res.status(401).json({ 
      message: `Please sign in with ${user.authProvider} instead` 
    });
  }

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
}));

// @route   POST /api/auth/google
// @desc    Google OAuth login/registration
// @access  Public
router.post('/google', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { googleToken, accessToken } = req.body;
  
  // Use either googleToken (JWT credential) or accessToken
  const token = googleToken || accessToken;

  if (!token) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  try {
    let userInfo;
    
    // Try to decode as JWT first (for id_token/credential)
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userInfo = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        googleId: decoded.sub
      };
    } catch (e) {
      // If not JWT, treat as access token and call Google API
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      userInfo = response.data;
    }

    const { email, name, picture } = userInfo;

    if (!email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but not with Google, update their Google info
      if (!user.googleId) {
        user.googleId = userInfo.googleId;
        user.avatar = picture;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      // Create new user with Google info
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId: userInfo.googleId,
        avatar: picture || '',
        authProvider: 'google'
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ message: 'Invalid Google token' });
  }
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }
  
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
}));

module.exports = router;

