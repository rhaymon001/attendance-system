const crypto = require('crypto');
const QRToken = require('../models/QRToken');

/**
 * generateQRToken
 * ---------------
 * Creates a cryptographically signed QR token for a session and
 * persists it to the QRTokens collection.
 *
 * Token format: "sessionId:timestamp:hmacSignature"
 *   - sessionId  : MongoDB ObjectId string of the session
 *   - timestamp  : Unix ms at time of generation (used for expiry check)
 *   - hmacSig    : HMAC-SHA256 of "sessionId:timestamp" using HMAC_SECRET
 *
 * The token stays valid for its full 2-minute window so the entire
 * class can scan the same displayed code. Student-level deduplication
 * is handled by the unique compound index { sessionId, studentId }
 * on AttendanceRecords — NOT by invalidating the token after one scan.
 *
 * @param   {string} sessionId  - MongoDB ObjectId as string
 * @returns {Promise<string>}   - The signed token string
 */
const generateQRToken = async (sessionId) => {
  const secret = process.env.HMAC_SECRET;

  if (!secret) {
    throw new Error('HMAC_SECRET environment variable is not set');
  }

  // Build the unsigned payload
  const timestamp = Date.now().toString();
  const payload = `${sessionId}:${timestamp}`;

  // Sign it
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Assemble the full token string
  const token = `${payload}:${signature}`;

  // Calculate expiry — 2 minutes from now
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  // Persist to DB so verifyToken can confirm it was legitimately issued
  await QRToken.create({
    sessionId,
    token,
    expiresAt,
  });

  return token;
};

module.exports = generateQRToken;
