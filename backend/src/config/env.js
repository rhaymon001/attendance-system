/**
 * Environment Variable Validator
 * ------------------------------
 * Validates that all required environment variables are present at startup.
 * Throws an Error if any are missing.
 */

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'HMAC_SECRET',
  'REDIS_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'CLIENT_URL',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}`
    );
  }
};

module.exports = validateEnv;
