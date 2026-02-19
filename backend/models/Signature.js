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
    required: true
  },
  signerEmail: {
    type: String,
    required: true
  },
  signerName: {
    type: String,
    required: true
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
