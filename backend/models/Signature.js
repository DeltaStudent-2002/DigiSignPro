const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  signerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  signerEmail: {
    type: String,
    required: false
  },
  signerName: {
    type: String,
    required: false
  },
  pageNumber: {
    type: Number,
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    default: 200
  },
  height: {
    type: Number,
    default: 50
  },
  signatureText: {
    type: String,
    default: ''
  },
  signatureImage: {
    type: String,
    default: ''
  },
  // Font styling for signature
  fontFamily: {
    type: String,
    default: 'Helvetica'
  },
  fontSize: {
    type: Number,
    default: 16
  },
  color: {
    type: String,
    default: '#000000'
  },
  isBold: {
    type: Boolean,
    default: false
  },
  isItalic: {
    type: Boolean,
    default: false
  },
  // PDF coordinate system metadata for accurate positioning
  pdfPageWidth: {
    type: Number,
    default: null
  },
  pdfPageHeight: {
    type: Number,
    default: null
  },
  displayWidth: {
    type: Number,
    default: null
  },
  scaleFactor: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  signedAt: {
    type: Date
  },
  token: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Signature', signatureSchema);
