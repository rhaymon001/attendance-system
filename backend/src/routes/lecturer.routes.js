const express = require('express');
const router = express.Router();
const lecturerController = require('../controllers/lecturer.controller');
const protect = require('../middleware/protect');
const authorise = require('../middleware/authorise');

router.use(protect, authorise('lecturer'));
router.get('/courses', lecturerController.getCourses);
router.get('/venues', lecturerController.getVenues);

module.exports = router;
