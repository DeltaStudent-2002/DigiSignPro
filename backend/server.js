const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();

const app = express();

// ✅ Connect DB (serverless-safe) - only in non-serverless or when not in test
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ✅ CORS (allow all for single deployment)
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  credentials: true
}));

app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/docs', require('./routes/documents'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/audit', require('./routes/audit'));

// Serve frontend for all non-API routes (SPA support)
app.get('*', (req, res) => {
  // If it's an API request that wasn't matched, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve frontend index.html for all other routes (SPA)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

// ✅ For local development - start server
// ✅ For Vercel - export app (serverless function handles listening)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
