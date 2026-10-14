const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const protect = require('../middleware/protect');
const authorise = require('../middleware/authorise');

router.use(protect, authorise('student'));
router.get('/courses', studentController.getMyCourses);

module.exports = router;
