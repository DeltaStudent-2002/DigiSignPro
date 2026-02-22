const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// Helper function to check if DB is connected
const isDBConnected = () => mongoose.connection.readyState === 1;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use different paths for different platforms
    let uploadDir;
    if (process.env.RENDER) {
      uploadDir = '/app/uploads';
    } else if (process.env.NETLIFY || process.env.VERCEL) {
      uploadDir = '/tmp/uploads';
    } else {
      uploadDir = 'uploads/';
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/docs/upload
// @desc    Upload a PDF document
// @access  Public (authentication optional for development)
router.post('/upload', auth, upload.single('document'), asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF file' });
  }

  const documentData = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    filepath: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    status: 'pending'
  };

  // Add userId if authenticated
  if (req.user && req.user.id) {
    documentData.userId = req.user.id;
  }

  const document = await Document.create(documentData);

  res.status(201).json(document);
}));

// @route   GET /api/docs
// @desc    Get all documents
// @access  Public (authentication optional for development)
router.get('/', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  let query = {};
  
  // Only filter by user if authenticated
  if (req.user && req.user.id) {
    query.userId = req.user.id;
  }
  
  const documents = await Document.find(query).sort({ createdAt: -1 });
  res.json(documents);
}));

// @route   GET /api/docs/:id
// @desc    Get single document by ID
// @access  Public (authentication optional for development)
router.get('/:id', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  let query = { _id: req.params.id };
  
  // Only filter by user if authenticated
  if (req.user && req.user.id) {
    query.userId = req.user.id;
  }

  const document = await Document.findOne(query);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.json(document);
}));

// @route   DELETE /api/docs/:id
// @desc    Delete a document
// @access  Public (authentication optional for development)
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  let query = { _id: req.params.id };
  
  // Only filter by user if authenticated
  if (req.user && req.user.id) {
    query.userId = req.user.id;
  }

  const document = await Document.findOne(query);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  // Delete file from filesystem
  if (fs.existsSync(document.filepath)) {
    fs.unlinkSync(document.filepath);
  }

  await Document.findByIdAndDelete(req.params.id);
  res.json({ message: 'Document removed' });
}));

// @route   PUT /api/docs/:id/status
// @desc    Update document status
// @access  Public (authentication optional for development)
router.put('/:id/status', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { status } = req.body;
  
  let query = { _id: req.params.id };
  
  // Only filter by user if authenticated
  if (req.user && req.user.id) {
    query.userId = req.user.id;
  }

  const document = await Document.findOneAndUpdate(
    query,
    { status, updatedAt: Date.now() },
    { new: true }
  );

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.json(document);
}));

// @route   GET /api/docs/:id/download
// @desc    Download a document
// @access  Public (authentication optional for development)
router.get('/:id/download', auth, async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ message: 'Database service unavailable' });
    }

    let query = { _id: req.params.id };
    
    // Only filter by user if authenticated
    if (req.user && req.user.id) {
      query.userId = req.user.id;
    }

    const document = await Document.findOne(query);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filepath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set headers for download
    res.download(document.filepath, document.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
