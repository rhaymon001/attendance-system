const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const protect = require('../middleware/protect');
const authorise = require('../middleware/authorise');
const { validateId, validateCreateSession } = require('../middleware/validate');

// Protect all session routes
router.use(protect);

router.get('/', authorise('lecturer'), sessionController.getSessions);
router.post('/', authorise('lecturer'), validateCreateSession, sessionController.createSession);
router.get('/:id/qr', authorise('lecturer'), validateId('id'), sessionController.generateQR);
router.get('/:id/attendance', authorise('lecturer'), validateId('id'), sessionController.getSessionAttendance);
router.patch('/:id/end', authorise('lecturer'), validateId('id'), sessionController.endSession);

module.exports = router;
