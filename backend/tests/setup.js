/**
 * Test Database Setup & Lifecycle Helpers
 * ---------------------------------------
 * Connects to TEST_MONGO_URI if provided in environment variables.
 * If not provided, guards database integration tests cleanly without hardcoding secrets,
 * as required by the system specification.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_hardening_12345';
process.env.HMAC_SECRET = process.env.HMAC_SECRET || 'test_hmac_secret_key_hardening_12345';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const mongoose = require('mongoose');

let isDbConnected = false;

const connectTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    isDbConnected = true;
    return true;
  }

  const uri = process.env.TEST_MONGO_URI;

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
      return true;
    } catch (err) {
      console.warn(`[TestSetup] Could not connect to TEST_MONGO_URI: ${err.message}`);
      return false;
    }
  }

  // Gracefully guard when no database connection string is provided
  return false;
};

const clearTestDB = async () => {
  if (isDbConnected && mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
};

const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  isDbConnected = false;
};

module.exports = {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
};
