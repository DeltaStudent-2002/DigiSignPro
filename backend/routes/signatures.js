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
const path = require('path');

// Helper function to check if DB is connected
const isDBConnected = () => mongoose.connection.readyState === 1;

// IMPORTANT: Define more specific routes BEFORE parameterized routes

// @route   POST /api/signatures/generate-signed-pdf/:documentId
// @desc    Generate signed PDF with embedded signatures
// @access  Public (authentication optional for development)
router.post('/generate-signed-pdf/:documentId', auth, asyncHandler(async (req, res) => {
  console.log('Generate signed PDF request for document:', req.params.documentId);
  
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const document = await Document.findById(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  console.log('Document found:', document._id, 'filepath:', document.filepath);

  const signatures = await Signature.find({ 
    documentId: req.params.documentId,
    status: 'signed'
  });

  console.log('Found signed signatures:', signatures.length);
  
  if (signatures.length === 0) {
    const allSigs = await Signature.find({ documentId: req.params.documentId });
    console.log('All signatures for this document:', allSigs.map(s => s.status));
    return res.status(400).json({ message: 'No signed signatures found' });
  }

  // Get the correct file path - handle both relative and absolute paths
  let filePath = document.filepath;
  
  // If path is relative, make it absolute
  if (filePath && !path.isAbsolute(filePath)) {
    filePath = path.join(__dirname, '..', filePath);
  }
  
  console.log('Full file path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (!filePath) {
    return res.status(400).json({ message: 'Document filepath is missing' });
  }
  
  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ message: 'Document file not found at path: ' + filePath });
  }

  try {
    console.log('Reading PDF from:', filePath);
    const pdfBytes = fs.readFileSync(filePath);
    console.log('PDF loaded, bytes:', pdfBytes.length);
    
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
      console.log('PDF document parsed');
    } catch (pdfErr) {
      console.error('Error loading PDF:', pdfErr);
      return res.status(500).json({ 
        message: 'Failed to load PDF document',
        error: pdfErr.message 
      });
    }
    
    const pages = pdfDoc.getPages();
    console.log('Number of pages:', pages.length);

    for (const sig of signatures) {
      console.log('Processing signature:', sig._id, 'page:', sig.pageNumber);
      
      const pageIndex = sig.pageNumber - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn('Invalid page number:', sig.pageNumber);
        continue;
      }
      
      const page = pages[pageIndex];
      const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
      console.log('Page size:', pdfPageWidth, 'x', pdfPageHeight);
      
      const fontFamily = sig.fontFamily || 'Helvetica';
      const fontSize = sig.fontSize || 16;
      const colorHex = sig.color || '#000000';
      const isBold = sig.isBold || false;
      const isItalic = sig.isItalic || false;
      
      const colorRgb = hexToRgb(colorHex);
      const pdfFont = getPDFFont(pdfDoc, fontFamily, isBold, isItalic);
      
      let pdfX, pdfY, pdfHeight;
      
      if (sig.pdfPageWidth && sig.displayWidth && sig.displayWidth > 0) {
        const scaleFactor = sig.displayWidth / sig.pdfPageWidth;
        pdfX = sig.x / scaleFactor;
        pdfHeight = (sig.height || 50) / scaleFactor;
        const displayY = sig.y;
        pdfY = pdfPageHeight - (displayY * (pdfPageHeight / (sig.pdfPageHeight || pdfPageHeight))) - pdfHeight;
      } else {
        pdfX = sig.x;
        pdfHeight = sig.height || 50;
        pdfY = pdfPageHeight - sig.y - pdfHeight;
      }
      
      pdfX = Math.max(0, Math.min(pdfX, pdfPageWidth - 50));
      pdfY = Math.max(0, Math.min(pdfY, pdfPageHeight - 30));
      
      console.log('Drawing at:', pdfX, ',', pdfY);
      
      page.drawText(sig.signatureText || `Signed by: ${sig.signerName}`, {
        x: pdfX,
        y: pdfY,
        size: fontSize,
        font: pdfFont,
        color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
      });

      page.drawText(`Date: ${new Date(sig.signedAt).toLocaleDateString()}`, {
        x: pdfX,
        y: pdfY - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    console.log('Saving PDF...');
    const signedPdfBytes = await pdfDoc.save();
    console.log('PDF saved, size:', signedPdfBytes.length);
    
    const signedFilename = `signed_${document.filename}`;
    const signedFileDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(signedFileDir)) {
      fs.mkdirSync(signedFileDir, { recursive: true });
    }
    
    const signedPath = path.join(signedFileDir, signedFilename);
    fs.writeFileSync(signedPath, signedPdfBytes);

    document.status = 'completed';
    document.signedPath = signedPath;
    await document.save();

    res.json({ 
      message: 'Signed PDF generated successfully',
      signedPath: `/uploads/${signedFilename}`
    });
  } catch (err) {
    console.error('PDF Generation Error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      message: 'Failed to generate signed PDF',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}));

// @route   POST /api/signatures
// @desc    Add a signature to a document
// @access  Public
router.post('/', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const { documentId, pageNumber, x, y, width, height, signerName, signerEmail, 
    displayWidth, pdfPageWidth, pdfPageHeight, scaleFactor } = req.body;

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
    token,
    pdfPageWidth: pdfPageWidth || null,
    pdfPageHeight: pdfPageHeight || null,
    displayWidth: displayWidth || null,
    scaleFactor: scaleFactor || null
  };

  if (req.user && req.user.id) {
    signatureData.signerId = req.user.id;
  }

  const signature = await Signature.create(signatureData);

  res.status(201).json(signature);
}));

// @route   GET /api/signatures/public/:token
// @desc    Get signature request by token
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

// @route   GET /api/signatures/:documentId
// @desc    Get all signatures for a document
// @access  Public
router.get('/:documentId', auth, asyncHandler(async (req, res) => {
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Database service unavailable' });
  }

  const query = { documentId: req.params.documentId };
  
  if (req.user && req.user.id) {
    query.signerId = req.user.id;
  }
  
  const signatures = await Signature.find(query).populate('signerId', 'name email');
  res.json(signatures);
}));

// @route   PUT /api/signatures/:id/sign
// @desc    Sign a document
// @access  Public
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
  signature.fontFamily = req.body.fontFamily || 'Helvetica';
  signature.fontSize = req.body.fontSize || 16;
  signature.color = req.body.color || '#000000';
  signature.isBold = req.body.isBold || false;
  signature.isItalic = req.body.isItalic || false;
  signature.status = 'signed';
  signature.signedAt = Date.now();

  await signature.save();

  await Document.findByIdAndUpdate(signature.documentId, {
    status: 'signed',
    updatedAt: Date.now()
  });

  res.json(signature);
}));

// Helper function to convert hex color to RGB
const hexToRgb = (hex) => {
  if (hex.length === 4) {
    const r = parseInt(hex[1] + hex[1], 16) / 255;
    const g = parseInt(hex[2] + hex[2], 16) / 255;
    const b = parseInt(hex[3] + hex[3], 16) / 255;
    return { r, g, b };
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

// Helper function to get pdf-lib font
const getPDFFont = (pdfDoc, fontFamily, isBold, isItalic) => {
  const fontName = (fontFamily || 'Helvetica').toLowerCase();
  let pdfFont;
  
  if (fontName.includes('times') || fontName.includes('serif') || fontName.includes('georgia') || fontName.includes('palatino')) {
    if (isBold && isItalic) {
      pdfFont = pdfDoc.getFont('TimesRoman-BoldItalic');
    } else if (isBold) {
      pdfFont = pdfDoc.getFont('TimesRoman-Bold');
    } else if (isItalic) {
      pdfFont = pdfDoc.getFont('TimesRoman-Italic');
    } else {
      pdfFont = pdfDoc.getFont('TimesRoman');
    }
  } else if (fontName.includes('courier') || fontName.includes('mono') || fontName.includes('consolas')) {
    if (isBold && isItalic) {
      pdfFont = pdfDoc.getFont('Courier-BoldOblique');
    } else if (isBold) {
      pdfFont = pdfDoc.getFont('Courier-Bold');
    } else if (isItalic) {
      pdfFont = pdfDoc.getFont('Courier-Oblique');
    } else {
      pdfFont = pdfDoc.getFont('Courier');
    }
  } else {
    if (isBold && isItalic) {
      pdfFont = pdfDoc.getFont('Helvetica-BoldOblique');
    } else if (isBold) {
      pdfFont = pdfDoc.getFont('Helvetica-Bold');
    } else if (isItalic) {
      pdfFont = pdfDoc.getFont('Helvetica-Oblique');
    } else {
      pdfFont = pdfDoc.getFont('Helvetica');
    }
  }
  
  return pdfFont;
};

module.exports = router;
