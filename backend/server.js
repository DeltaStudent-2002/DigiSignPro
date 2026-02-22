const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

<<<<<<< HEAD
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
=======
/* =========================
   CORS CONFIGURATION
   ========================= */

// Allow localhost + all Vercel preview deployments
const allowedOrigins = [
  'http://localhost:5173',
  'https://document-signature-app-7y7i.vercel.app/'
];

app.use(cors({
  origin: function (origin, callback) {

    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow localhost & main production domain
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

/* =========================
   MIDDLEWARE
   ========================= */

>>>>>>> 97d70facf11e2b1361ec796dab87f0f1fc1c932e
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders - use different paths for different platforms
let uploadsPath;
let publicPath;

<<<<<<< HEAD
if (process.env.RENDER) {
  uploadsPath = '/app/uploads';
  publicPath = path.join(__dirname, '../frontend/dist');
} else if (process.env.NETLIFY) {
  uploadsPath = '/tmp/uploads';
  publicPath = path.join(__dirname, 'public');
} else if (process.env.VERCEL) {
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

// API Routes
app.use('/api/auth', require('./routes/auth'));
=======
/* =========================
   ROUTES
   ========================= */

>>>>>>> 97d70facf11e2b1361ec796dab87f0f1fc1c932e
app.use('/api/docs', require('./routes/documents'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/audit', require('./routes/audit'));

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
      message: 'Backend is running. Frontend not deployed. Deploy frontend separately or use combined deployment.',
      endpoints: ['/api/auth', '/api/docs', '/api/signatures', '/api/audit']
    });
  }
});

<<<<<<< HEAD
// Error middleware
=======
/* =========================
   ERROR HANDLER
   ========================= */

>>>>>>> 97d70facf11e2b1361ec796dab87f0f1fc1c932e
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

<<<<<<< HEAD
=======
/* =========================
   DATABASE CONNECTION
   ========================= */

connectDB();

>>>>>>> 97d70facf11e2b1361ec796dab87f0f1fc1c932e
const PORT = process.env.PORT || 5000;

// ✅ For local development - start server
// ✅ For Vercel - export app (serverless function handles listening)
// ✅ For Render - export app (Render handles listening)
// ✅ For Netlify - export app (Netlify handles listening)
if (process.env.VERCEL !== '1' && process.env.RENDER !== 'true' && process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
