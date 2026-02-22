const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');
const asyncHandler = require('../middleware/asyncHandler');
const Signature = require('../models/Signature');
const Document = require('../models/Document');

// Helper function to check if DB is connected
const isDBConnected = () => mongoose.connection.readyState === 1;

// Apply auth middleware (now optional for development)
// The auth middleware allows requests without tokens to pass through
router.use(auth);

// Apply audit middleware to track all requests (will handle optional auth)
router.use(auditMiddleware);

// @route   GET /api/audit/:fileId
// @desc    Get audit trail for a document
<<<<<<< HEAD
// @access  Public (authentication optional for development)
router.get('/:fileId', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
=======
// @access  Private
router.get('/:fileId', async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.fileId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user owns the document or is a signer
    const signatures = await Signature.find({ documentId: req.params.fileId })
      .populate('signerId', 'name email')
      .sort({ createdAt: -1 });

    // Build audit trail
    const auditTrail = {
      document: {
        id: document._id,
        name: document.originalName,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      },
      signatures: signatures.map(sig => ({
        id: sig._id,
        signerName: sig.signerName,
        signerEmail: sig.signerEmail,
        status: sig.status,
        pageNumber: sig.pageNumber,
        signedAt: sig.signedAt,
        createdAt: sig.createdAt
      }))
    };

    res.json(auditTrail);
  } catch (error) {
    next(error);
>>>>>>> 97d70facf11e2b1361ec796dab87f0f1fc1c932e
  }

  const document = await Document.findById(req.params.fileId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const signatures = await Signature.find({ documentId: req.params.fileId })
    .populate('signerId', 'name email')
    .sort({ createdAt: -1 });

  const auditTrail = {
    document: {
      id: document._id,
      name: document.originalName,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    },
    signatures: signatures.map(sig => ({
      id: sig._id,
      signerName: sig.signerName,
      signerEmail: sig.signerEmail,
      status: sig.status,
      pageNumber: sig.pageNumber,
      signedAt: sig.signedAt,
      createdAt: sig.createdAt
    }))
  };

  res.json(auditTrail);
}));

// @route   GET /api/audit
<<<<<<< HEAD
// @desc    Get all audit trails
// @access  Public (authentication optional for development)
router.get('/', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
=======
// @desc    Get all audit trails for user's documents
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });

    const auditTrails = await Promise.all(
      documents.map(async (doc) => {
        const signatures = await Signature.find({ documentId: doc._id });
        return {
          document: {
            id: doc._id,
            name: doc.originalName,
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          },
          signatureCount: signatures.length,
          signedCount: signatures.filter(s => s.status === 'signed').length
        };
      })
    );

    res.json(auditTrails);
  } catch (error) {
    next(error);
>>>>>>> 97d70facf11e2b1361ec796dab87f0f1fc1c932e
  }

  let query = {};
  
  // Only filter by user if authenticated
  if (req.user && req.user.id) {
    query.userId = req.user.id;
  }
  
  const documents = await Document.find(query).sort({ updatedAt: -1 });

  const auditTrails = await Promise.all(
    documents.map(async (doc) => {
      const signatures = await Signature.find({ documentId: doc._id });
      return {
        document: {
          id: doc._id,
          name: doc.originalName,
          status: doc.status,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        },
        signatureCount: signatures.length,
        signedCount: signatures.filter(s => s.status === 'signed').length
      };
    })
  );

  res.json(auditTrails);
}));

// Error handling wrapper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = router;
