const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates whether a given string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

/**
 * Middleware factory to validate MongoDB ObjectId in route params.
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid ${paramName} format`,
        reason: 'invalid_id',
      });
    }
    next();
  };
};

/**
 * Validates POST /api/auth/login body
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      message: 'A valid email address is required',
      reason: 'validation_error',
    });
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({
      message: 'Password is required',
      reason: 'validation_error',
    });
  }

  next();
};

/**
 * Validates POST /api/admin/lecturers body
 */
const validateCreateLecturer = (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      message: 'Name is required (minimum 2 characters)',
      reason: 'validation_error',
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      message: 'A valid email address is required',
      reason: 'validation_error',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long',
      reason: 'validation_error',
    });
  }

  next();
};

const validateCreateStudent = (req, res, next) => {
  const { name, email, matricNo, department, level } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name is required', reason: 'validation_error' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ message: 'A valid email address is required', reason: 'validation_error' });
  }
  if (!matricNo || typeof matricNo !== 'string' || !matricNo.trim()) {
    return res.status(400).json({ message: 'Matric number is required', reason: 'validation_error' });
  }
  if (!department || typeof department !== 'string' || !department.trim()) {
    return res.status(400).json({ message: 'Department is required', reason: 'validation_error' });
  }
  if (level === undefined || !/^\d{3}$/.test(String(level))) {
    return res.status(400).json({ message: 'Level must be a three-digit value', reason: 'validation_error' });
  }
  next();
};

const validateUpdateStudent = (req, res, next) => {
  const { name, email, matricNo, department, level } = req.body || {};
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({ message: 'Name must contain at least 2 characters', reason: 'validation_error' });
  }
  if (email !== undefined && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    return res.status(400).json({ message: 'A valid email address is required', reason: 'validation_error' });
  }
  if (matricNo !== undefined && (typeof matricNo !== 'string' || !matricNo.trim())) {
    return res.status(400).json({ message: 'Matric number cannot be empty', reason: 'validation_error' });
  }
  if (department !== undefined && typeof department !== 'string') {
    return res.status(400).json({ message: 'Department must be text', reason: 'validation_error' });
  }
  if (level !== undefined && !/^\d{3}$/.test(String(level))) {
    return res.status(400).json({ message: 'Level must be a three-digit value', reason: 'validation_error' });
  }
  next();
};

const validateUpdateLecturer = (req, res, next) => {
  const { name, email, department } = req.body || {};
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({ message: 'Name must contain at least 2 characters', reason: 'validation_error' });
  }
  if (email !== undefined && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    return res.status(400).json({ message: 'A valid email address is required', reason: 'validation_error' });
  }
  if (department !== undefined && typeof department !== 'string') {
    return res.status(400).json({ message: 'Department must be text', reason: 'validation_error' });
  }
  next();
};

/**
 * Validates POST /api/admin/courses body
 */
const validateCreateCourse = (req, res, next) => {
  const { title, code, lecturerId } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return res.status(400).json({
      message: 'Course title is required',
      reason: 'validation_error',
    });
  }

  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    return res.status(400).json({
      message: 'Course code is required',
      reason: 'validation_error',
    });
  }

  if (!lecturerId || !isValidObjectId(lecturerId)) {
    return res.status(400).json({
      message: 'A valid lecturerId is required',
      reason: 'validation_error',
    });
  }

  next();
};

/**
 * Validates PUT /api/admin/courses/:id body and param
 */
const validateUpdateCourse = (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: 'Invalid course ID format',
      reason: 'invalid_id',
    });
  }

  const { lecturerId, enrolledStudents, studentId, removeStudentId, alertThreshold } = req.body || {};

  if (lecturerId !== undefined && !isValidObjectId(lecturerId)) {
    return res.status(400).json({
      message: 'Invalid lecturerId format',
      reason: 'validation_error',
    });
  }

  if (enrolledStudents !== undefined) {
    if (!Array.isArray(enrolledStudents) || enrolledStudents.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({
        message: 'enrolledStudents must be an array of valid student IDs',
        reason: 'validation_error',
      });
    }
  }

  for (const id of [studentId, removeStudentId]) {
    if (id !== undefined && !isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid student ID format', reason: 'invalid_id' });
    }
  }

  if (alertThreshold !== undefined && (!Number.isFinite(Number(alertThreshold)) || Number(alertThreshold) < 0 || Number(alertThreshold) > 100)) {
    return res.status(400).json({ message: 'alertThreshold must be between 0 and 100', reason: 'validation_error' });
  }

  next();
};

/**
 * Validates POST /api/admin/venues body
 */
const validateCreateVenue = (req, res, next) => {
  const { name, lat, lng, radiusMetres } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      message: 'Venue name is required',
      reason: 'validation_error',
    });
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (lat === undefined || isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    return res.status(400).json({
      message: 'Latitude must be a valid number between -90 and 90',
      reason: 'validation_error',
    });
  }

  if (lng === undefined || isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({
      message: 'Longitude must be a valid number between -180 and 180',
      reason: 'validation_error',
    });
  }

  if (radiusMetres !== undefined && (isNaN(Number(radiusMetres)) || Number(radiusMetres) <= 0)) {
    return res.status(400).json({
      message: 'radiusMetres must be a positive number',
      reason: 'validation_error',
    });
  }

  next();
};

/**
 * Validates POST /api/sessions body
 */
const validateCreateSession = (req, res, next) => {
  const { courseId, venueId } = req.body || {};

  if (!courseId || !isValidObjectId(courseId)) {
    return res.status(400).json({
      message: 'A valid courseId is required',
      reason: 'validation_error',
    });
  }

  if (!venueId || !isValidObjectId(venueId)) {
    return res.status(400).json({
      message: 'A valid venueId is required',
      reason: 'validation_error',
    });
  }

  next();
};

/**
 * Validates POST /api/attendance/checkin body
 */
const validateCheckIn = (req, res, next) => {
  const { token, lat, lng } = req.body || {};

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({
      message: 'token, lat and lng are required',
      reason: 'validation_error',
    });
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (lat === undefined || lng === undefined || isNaN(parsedLat) || isNaN(parsedLng)) {
    return res.status(400).json({
      message: 'lat and lng must be numbers',
      reason: 'validation_error',
    });
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({
      message: 'Coordinates out of valid range (-90..90 for lat, -180..180 for lng)',
      reason: 'validation_error',
    });
  }

  next();
};

/**
 * Validates GET /api/reports/:courseId param
 */
const validateReportParams = (req, res, next) => {
  if (!isValidObjectId(req.params.courseId)) {
    return res.status(400).json({
      message: 'Invalid courseId format',
      reason: 'invalid_id',
    });
  }
  next();
};

module.exports = {
  isValidObjectId,
  validateId,
  validateLogin,
  validateCreateLecturer,
  validateCreateStudent,
  validateUpdateStudent,
  validateUpdateLecturer,
  validateCreateCourse,
  validateUpdateCourse,
  validateCreateVenue,
  validateCreateSession,
  validateCheckIn,
  validateReportParams,
};
