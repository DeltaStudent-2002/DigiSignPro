const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

// Helper function to check if DB is connected
const isDBConnected = () => mongoose.connection.readyState === 1;

// @route   POST /api/signatures
// @desc    Add a signature to a document
// @access  Public (authentication optional for development)
router.post('/', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { documentId, pageNumber, x, y, width, height, signerName, signerEmail } = req.body;

  const document = await Document.findById(documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const token = crypto.randomBytes(32).toString('hex');

  const signatureData = {
    documentId,
    signerEmail,
    signerName,
    pageNumber,
    x,
    y,
    width,
    height,
    status: 'pending',
    token
  };

  // Add signerId if authenticated
  if (req.user && req.user.id) {
    signatureData.signerId = req.user.id;
  }

  const signature = await Signature.create(signatureData);

  res.status(201).json(signature);
}));

// @route   GET /api/signatures/:documentId
// @desc    Get all signatures for a document
// @access  Public (authentication optional for development)
router.get('/:documentId', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const query = { documentId: req.params.documentId };
  
  // Only filter by signer if authenticated
  if (req.user && req.user.id) {
    query.signerId = req.user.id;
  }
  
  const signatures = await Signature.find(query).populate('signerId', 'name email');
  res.json(signatures);
}));

// @route   PUT /api/signatures/:id/sign
// @desc    Sign a document (mark signature as signed)
// @access  Public (authentication optional for development)
router.put('/:id/sign', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { signatureText } = req.body;

  const signature = await Signature.findById(req.params.id);
  if (!signature) {
    return res.status(404).json({ message: 'Signature not found' });
  }

  signature.signatureText = signatureText || '';
  signature.status = 'signed';
  signature.signedAt = Date.now();

  await signature.save();

  await Document.findByIdAndUpdate(signature.documentId, {
    status: 'signed',
    updatedAt: Date.now()
  });

  res.json(signature);
}));

// @route   GET /api/signatures/public/:token
// @desc    Get signature request by token (for external signers)
// @access  Public
router.get('/public/:token', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const signature = await Signature.findOne({ token: req.params.token })
    .populate('documentId');

  if (!signature) {
    return res.status(404).json({ message: 'Signature request not found' });
  }

  res.json(signature);
}));

// @route   POST /api/signatures/public/:token/sign
// @desc    Sign document as external user
// @access  Public
router.post('/public/:token/sign', asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { signatureText, signerName, signerEmail } = req.body;

  const signature = await Signature.findOne({ token: req.params.token });
  if (!signature) {
    return res.status(404).json({ message: 'Signature request not found' });
  }

  if (signature.status === 'signed') {
    return res.status(400).json({ message: 'Already signed' });
  }

  signature.signatureText = signatureText || '';
  signature.signerName = signerName || signature.signerName;
  signature.signerEmail = signerEmail || signature.signerEmail;
  signature.status = 'signed';
  signature.signedAt = Date.now();

  await signature.save();

  await Document.findByIdAndUpdate(signature.documentId, {
    status: 'signed',
    updatedAt: Date.now()
  });

  res.json({ message: 'Document signed successfully', signature });
}));

// @route   POST /api/signatures/:documentId/generate-signed-pdf
// @desc    Generate signed PDF with embedded signatures
// @access  Public (authentication optional for development)
router.post('/generate-signed-pdf/:documentId', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const document = await Document.findById(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const signatures = await Signature.find({ 
    documentId: req.params.documentId,
    status: 'signed'
  });

  if (signatures.length === 0) {
    return res.status(400).json({ message: 'No signed signatures found' });
  }

  const pdfBytes = fs.readFileSync(document.filepath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const sig of signatures) {
    const page = pages[sig.pageNumber - 1];
    if (page) {
      const { width, height } = page.getSize();
      
      page.drawText(sig.signatureText || `Signed by: ${sig.signerName}`, {
        x: sig.x,
        y: height - sig.y - sig.height,
        size: 12,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Date: ${new Date(sig.signedAt).toLocaleDateString()}`, {
        x: sig.x,
        y: height - sig.y - sig.height - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  const signedPdfBytes = await pdfDoc.save();
  const signedFilename = `signed_${document.filename}`;
  const signedPath = `uploads/${signedFilename}`;
  
  fs.writeFileSync(signedPath, signedPdfBytes);

  document.status = 'completed';
  document.signedPath = signedPath;
  await document.save();

  res.json({ 
    message: 'Signed PDF generated successfully',
    signedPath: `/uploads/${signedFilename}`
  });
}));

module.exports = router;
