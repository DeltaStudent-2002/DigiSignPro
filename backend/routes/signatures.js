const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

// @route   POST /api/signatures
// @desc    Add a signature to a document
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { documentId, pageNumber, x, y, width, height, signerName, signerEmail } = req.body;

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Generate a unique token for external signing
    const token = crypto.randomBytes(32).toString('hex');

    const signature = await Signature.create({
      documentId,
      signerId: req.user.id,
      signerEmail,
      signerName,
      pageNumber,
      x,
      y,
      width,
      height,
      status: 'pending',
      token
    });

    res.status(201).json(signature);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/signatures/:documentId
// @desc    Get all signatures for a document
// @access  Private
router.get('/:documentId', auth, async (req, res) => {
  try {
    const signatures = await Signature.find({ documentId: req.params.documentId })
      .populate('signerId', 'name email');
    res.json(signatures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/signatures/:id/sign
// @desc    Sign a document (mark signature as signed)
// @access  Private
router.put('/:id/sign', auth, async (req, res) => {
  try {
    const { signatureText } = req.body;

    const signature = await Signature.findById(req.params.id);
    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    signature.signatureText = signatureText || '';
    signature.status = 'signed';
    signature.signedAt = Date.now();

    await signature.save();

    // Update document status
    await Document.findByIdAndUpdate(signature.documentId, {
      status: 'signed',
      updatedAt: Date.now()
    });

    res.json(signature);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/signatures/public/:token
// @desc    Get signature request by token (for external signers)
// @access  Public
router.get('/public/:token', async (req, res) => {
  try {
    const signature = await Signature.findOne({ token: req.params.token })
      .populate('documentId');

    if (!signature) {
      return res.status(404).json({ message: 'Signature request not found' });
    }

    res.json(signature);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/signatures/public/:token/sign
// @desc    Sign document as external user
// @access  Public
router.post('/public/:token/sign', async (req, res) => {
  try {
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

    // Update document status
    await Document.findByIdAndUpdate(signature.documentId, {
      status: 'signed',
      updatedAt: Date.now()
    });

    res.json({ message: 'Document signed successfully', signature });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/signatures/:id/generate-signed-pdf
// @desc    Generate signed PDF with embedded signatures
// @access  Private
router.post('/:documentId/generate-signed-pdf', auth, async (req, res) => {
  try {
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

    // Read the original PDF
    const pdfBytes = fs.readFileSync(document.filepath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Embed signatures on each page
    for (const sig of signatures) {
      const page = pages[sig.pageNumber - 1];
      if (page) {
        const { width, height } = page.getSize();
        
        // Add signature text
        page.drawText(sig.signatureText || `Signed by: ${sig.signerName}`, {
          x: sig.x,
          y: height - sig.y - sig.height,
          size: 12,
          color: rgb(0, 0, 0),
        });

        // Add signed date
        page.drawText(`Date: ${new Date(sig.signedAt).toLocaleDateString()}`, {
          x: sig.x,
          y: height - sig.y - sig.height - 20,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    // Save the signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedFilename = `signed_${document.filename}`;
    const signedPath = `uploads/${signedFilename}`;
    
    fs.writeFileSync(signedPath, signedPdfBytes);

    // Update document status
    document.status = 'completed';
    document.signedPath = signedPath;
    await document.save();

    res.json({ 
      message: 'Signed PDF generated successfully',
      signedPath: `/uploads/${signedFilename}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
