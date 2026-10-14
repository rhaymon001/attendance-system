const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Auto-delete expired tokens
qrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const QRToken = mongoose.model('QRToken', qrTokenSchema);

module.exports = QRToken;
