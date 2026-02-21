const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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
    password
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
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

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
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
