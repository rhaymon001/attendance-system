process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_hardening_12345';
process.env.HMAC_SECRET = process.env.HMAC_SECRET || 'test_hmac_secret_key_hardening_12345';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const haversineDistance = require('../src/utils/haversine');
const verifyQRToken = require('../src/utils/verifyToken');
const {
  validateId,
  validateCheckIn,
  validateCreateCourse,
  validateCreateVenue,
  validateCreateSession,
} = require('../src/middleware/validate');
const authorise = require('../src/middleware/authorise');
const errorHandler = require('../src/middleware/errorHandler');

describe('Validation Layer, Security Guard & Utility Tests', () => {
  describe('Authentication Request Validation via HTTP', () => {
    test('rejects login with missing email (400 validation_error)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123!' });

      expect(response.status).toBe(400);
      expect(response.body.reason).toBe('validation_error');
      expect(response.body.message).toMatch(/valid email/i);
    });

    test('rejects login with malformed email (400 validation_error)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password123!' });

      expect(response.status).toBe(400);
      expect(response.body.reason).toBe('validation_error');
    });

    test('rejects login with missing password (400 validation_error)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@university.edu' });

      expect(response.status).toBe(400);
      expect(response.body.reason).toBe('validation_error');
      expect(response.body.message).toMatch(/password is required/i);
    });
  });

  describe('Route Protection Without Token via HTTP', () => {
    test('rejects GET /api/auth/me without authorization header (401)', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/no token provided/i);
    });

    test('rejects POST /api/attendance/checkin without authorization header (401)', async () => {
      const response = await request(app)
        .post('/api/attendance/checkin')
        .send({ token: 'test:123:sig', lat: 9.0, lng: 7.0 });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/no token provided/i);
    });

    test('rejects GET /api/sessions without authorization header (401)', async () => {
      const response = await request(app).post('/api/sessions').send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/no token provided/i);
    });

    test('rejects GET /api/reports/:courseId without authorization header (401)', async () => {
      const response = await request(app).get('/api/reports/507f1f77bcf86cd799439011');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/no token provided/i);
    });
  });

  describe('Centralized Validation Middleware Unit Tests', () => {
    const mockRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    test('validateId rejects malformed ObjectId with 400 invalid_id', () => {
      const req = { params: { id: 'invalid-id-123' } };
      const res = mockRes();
      const next = jest.fn();

      validateId('id')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'invalid_id' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('validateId permits valid 24-char hex ObjectId', () => {
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = mockRes();
      const next = jest.fn();

      validateId('id')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('validateCheckIn rejects missing token, non-numeric or out-of-range coordinates', () => {
      const req = { body: { token: '', lat: 999.0, lng: 200.0 } };
      const res = mockRes();
      const next = jest.fn();

      validateCheckIn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'validation_error' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('validateCheckIn passes valid coordinates and token', () => {
      const req = { body: { token: 'session:12345:signature', lat: 9.0765, lng: 7.3986 } };
      const res = mockRes();
      const next = jest.fn();

      validateCheckIn(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('validateCreateCourse rejects missing title or invalid lecturerId', () => {
      const req = { body: { title: '', code: 'CSC401', lecturerId: 'bad-id' } };
      const res = mockRes();
      const next = jest.fn();

      validateCreateCourse(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('validateCreateVenue rejects invalid latitude coordinates', () => {
      const req = { body: { name: 'Main Hall', lat: 105.0, lng: 7.3986 } };
      const res = mockRes();
      const next = jest.fn();

      validateCreateVenue(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('validateCreateSession rejects missing venueId or courseId', () => {
      const req = { body: { courseId: '507f1f77bcf86cd799439011' } };
      const res = mockRes();
      const next = jest.fn();

      validateCreateSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role Guard Authorize Middleware Unit Tests', () => {
    test('authorise rejects role mismatch with 403 Forbidden', () => {
      const req = { user: { _id: '123', role: 'student' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authorise('lecturer')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
      expect(next).not.toHaveBeenCalled();
    });

    test('authorise permits matching role', () => {
      const req = { user: { _id: '123', role: 'lecturer' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authorise('lecturer')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Error Handler Middleware Consistency Tests', () => {
    test('formats Mongoose CastError into 400 Bad Request with invalid_id reason', () => {
      const err = new Error('Cast error');
      err.name = 'CastError';
      err.path = 'sessionId';

      const req = { method: 'GET', originalUrl: '/test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid sessionId format',
        reason: 'invalid_id',
      });
    });

    test('formats MongoDB duplicate key error code 11000 into 409 Conflict', () => {
      const err = new Error('Duplicate key');
      err.code = 11000;
      err.keyValue = { email: 'test@university.edu' };

      const req = { method: 'POST', originalUrl: '/test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'A record with this email already exists',
        reason: 'duplicate_key',
      });
    });
  });

  describe('Haversine Geofence Calculations', () => {
    test('computes distance accurately within 50m geofence radius', () => {
      const distance = haversineDistance(11.1561, 7.6228, 11.1558, 7.6231);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThanOrEqual(50);
    });

    test('computes distance accurately for coordinates outside 50m radius', () => {
      const distance = haversineDistance(11.1561, 7.6228, 11.1630, 7.6250);
      expect(distance).toBeGreaterThan(50);
    });
  });

  describe('QR Token Verification Security Logic', () => {
    test('returns invalid with tampered reason for invalid colon structure', async () => {
      const result = await verifyQRToken('single-string-without-colons');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('tampered');
    });

    test('returns invalid with tampered reason for token with altered HMAC signature', async () => {
      const now = Date.now().toString();
      const fakeToken = `507f1f77bcf86cd799439011:${now}:badsignaturehex`;
      const result = await verifyQRToken(fakeToken);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('tampered');
    });

    test('returns invalid with expired reason for timestamp older than 2 minutes (120000ms)', async () => {
      const secret = process.env.HMAC_SECRET;
      const expiredTimestamp = (Date.now() - 130000).toString(); // 130 seconds ago
      const sessionId = '507f1f77bcf86cd799439011';
      const payload = `${sessionId}:${expiredTimestamp}`;
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const expiredToken = `${payload}:${sig}`;

      const result = await verifyQRToken(expiredToken);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });
  });
});
