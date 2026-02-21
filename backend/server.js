const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

/* =========================
   CORS CONFIGURATION
   ========================= */

// Allow localhost + all Vercel preview deployments
const allowedOrigins = [
  'http://localhost:5173',
  'https://document-signature-app-zeta.vercel.app'
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   ROUTES
   ========================= */

app.use('/api/docs', require('./routes/documents'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/audit', require('./routes/audit'));

// Root route
app.get('/', (req, res) => {
  res.send('Document Signing API is running...');
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
