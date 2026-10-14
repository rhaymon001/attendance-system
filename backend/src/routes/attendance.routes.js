const express = require('express');
const router = express.Router();
const { checkIn, getMyAttendance } = require('../controllers/attendance.controller');
const protect = require('../middleware/protect');
const authorise = require('../middleware/authorise');
const { validateCheckIn } = require('../middleware/validate');

router.post('/checkin', protect, authorise('student'), validateCheckIn, checkIn);
router.get('/my-history', protect, authorise('student'), getMyAttendance);

module.exports = router;
