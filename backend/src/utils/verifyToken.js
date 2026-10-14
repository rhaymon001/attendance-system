const crypto = require('crypto');
const QRToken = require('../models/QRToken');

/**
 * verifyQRToken
 * -------------
 * Verifies a QR token submitted by a student at check-in.
 * Runs three checks in order — fails fast on the first failure:
 *
 *   1. Structure  — token must have exactly three colon-separated parts
 *   2. Signature  — HMAC recomputed from payload must match stored sig
 *   3. Expiry     — timestamp must be within the 2-minute window
 *   4. DB lookup  — token must exist in QRTokens (was genuinely issued)
 *
 * NOTE: There is no "used" check here. The token remains valid for its
 * full 2-minute window so multiple students can scan the same displayed
 * code. Preventing a single student from checking in twice is handled
 * by the unique compound index { sessionId, studentId } on
 * AttendanceRecords at the DB level.
 *
 * @param   {string} token - The raw token string from the student's scan
 * @returns {Promise<{ valid: boolean, reason?: string, sessionId?: string, qrTokenDoc?: object }>}
 */
const verifyQRToken = async (token) => {
  const secret = process.env.HMAC_SECRET;

  if (!secret) {
    throw new Error('HMAC_SECRET environment variable is not set');
  }

  // ── 1. Structure check ──────────────────────────────────────────────
  // Expected: "sessionId:timestamp:signature"
  const parts = token.split(':');

  if (parts.length !== 3) {
    return { valid: false, reason: 'tampered' };
  }

  const [sessionId, timestamp, receivedSig] = parts;

  if (!sessionId || !timestamp || !receivedSig) {
    return { valid: false, reason: 'tampered' };
  }

  // ── 2. Signature check ──────────────────────────────────────────────
  // Recompute HMAC from the payload portion and compare
  const payload = `${sessionId}:${timestamp}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const receivedBuf = Buffer.from(receivedSig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  const signaturesMatch =
    receivedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(receivedBuf, expectedBuf);

  if (!signaturesMatch) {
    return { valid: false, reason: 'tampered' };
  }

  // ── 3. Expiry check ─────────────────────────────────────────────────
  // Token is valid for exactly 2 minutes (120,000 ms)
  const tokenAge = Date.now() - parseInt(timestamp, 10);

  if (tokenAge > 120000) {
    return { valid: false, reason: 'expired' };
  }

  // ── 4. DB existence check ───────────────────────────────────────────
  // Confirm the token was genuinely issued by this server
  // (guards against someone crafting tokens with a leaked secret)
  const qrTokenDoc = await QRToken.findOne({ token });

  if (!qrTokenDoc) {
    return { valid: false, reason: 'invalid' };
  }

  // All checks passed
  return { valid: true, sessionId, qrTokenDoc };
};

module.exports = verifyQRToken;
