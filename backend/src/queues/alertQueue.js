const Queue = require('bull');

/**
 * alertQueue
 * ----------
 * Bull queue named 'absenteeism-alerts' connected to Redis via REDIS_URL.
 * Job payload:
 *   { studentEmail, studentName, courseName, courseCode, percentage, threshold, lecturerEmail }
 */
const alertQueue = new Queue('absenteeism-alerts', process.env.REDIS_URL);

module.exports = alertQueue;
