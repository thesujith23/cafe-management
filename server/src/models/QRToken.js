import mongoose from 'mongoose';
import crypto from 'crypto';

const qrTokenSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiningTable',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Generate a secure random token
qrTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Validate a token and return the associated table
qrTokenSchema.statics.validateToken = async function (token) {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }
  try {
    const qrToken = await this.findOne({
      token,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).populate('table');

    if (!qrToken || !qrToken.table || !qrToken.table.isActive) {
      return null;
    }

    return qrToken;
  } catch (err) {
    console.warn('Notice: QRToken.validateToken failed:', err.message);
    return null;
  }
};

// Revoke a token
qrTokenSchema.methods.revoke = async function () {
  this.isActive = false;
  this.revokedAt = new Date();
  return this.save();
};

const QRToken = mongoose.model('QRToken', qrTokenSchema);
export default QRToken;
