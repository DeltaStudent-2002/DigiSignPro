const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

/* =========================
   CORS CONFIGURATION
   ========================= */

// Allow localhost + all Vercel preview deployments + production domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://document-signature-app-one.vercel.app',
  'https://document-signature-app-7y7i.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow localhost & main production domains
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Allow all localhost variations
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    return callback(null, true); // Allow all for development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

/* =========================
   MIDDLEWARE
   ========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
   ========================= */

// Determine paths based on environment
let uploadsPath;
let publicPath;

if (process.env.RENDER) {
  uploadsPath = '/app/uploads';
  publicPath = path.join(__dirname, '../frontend/dist');
} else if (process.env.NETLIFY) {
  uploadsPath = '/tmp/uploads';
  publicPath = path.join(__dirname, 'public');
} else if (process.env.VERCEL === '1') {
  uploadsPath = '/tmp/uploads';
  publicPath = path.join(__dirname, '../frontend/dist');
} else {
  uploadsPath = path.join(__dirname, 'uploads');
  publicPath = path.join(__dirname, 'public');
}

// Serve uploads if directory exists
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// Serve frontend static files only if they exist
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

/* =========================
   ROUTES
   ========================= */

app.use('/api/auth', require('./routes/auth'));
app.use('/api/docs', require('./routes/documents'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/audit', require('./routes/audit'));

/* =========================
   SPA FALLBACK
   ========================= */

// Serve frontend for all non-API routes (SPA support)
app.get('*', (req, res) => {
  // If it's an API request that wasn't matched, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve frontend index.html if it exists, otherwise return a message
  if (fs.existsSync(path.join(publicPath, 'index.html'))) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    res.json({ 
      message: 'Backend is running. Frontend not deployed.',
      endpoints: ['/api/auth', '/api/docs', '/api/signatures', '/api/audit']
    });
  }
});

/* =========================
   ERROR HANDLER
   ========================= */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

/* =========================
   DATABASE CONNECTION
   ========================= */

connectDB();

/* =========================
   SERVER START
   ========================= */

const PORT = process.env.PORT || 5001;

// For local development - start server
// For Vercel/Render/Netlify - export app (serverless function handles listening)
if (process.env.VERCEL !== '1' && process.env.RENDER !== 'true' && process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
