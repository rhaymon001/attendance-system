const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const protect = require('../middleware/protect');
const authorise = require('../middleware/authorise');
const { validateReportParams } = require('../middleware/validate');

// Protect all report routes and restrict to lecturer role
router.use(protect, authorise('lecturer'));

router.get('/:courseId', validateReportParams, reportController.getCourseStats);
router.get('/:courseId/export/csv', validateReportParams, reportController.exportCSV);
router.get('/:courseId/export/pdf', validateReportParams, reportController.exportPDF);

module.exports = router;
