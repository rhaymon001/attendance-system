const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const protect = require('../middleware/protect');
const { validateLogin } = require('../middleware/validate');

router.post('/login', validateLogin, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
