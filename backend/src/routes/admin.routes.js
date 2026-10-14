const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const protect = require('../middleware/protect');
const authorise = require('../middleware/authorise');
const {
  validateCreateLecturer,
  validateCreateStudent,
  validateUpdateStudent,
  validateUpdateLecturer,
  validateCreateCourse,
  validateUpdateCourse,
  validateCreateVenue,
  validateId,
} = require('../middleware/validate');

const upload = multer({ storage: multer.memoryStorage() });

// Protect all admin routes and restrict to admin role
router.use(protect, authorise('admin'));

router.get('/students', adminController.getStudents);
router.post('/students', validateCreateStudent, adminController.createStudent);
router.put('/students/:id', validateId('id'), validateUpdateStudent, adminController.updateStudent);
router.delete('/students/:id', validateId('id'), adminController.deleteStudent);
router.post('/students/import', upload.single('file'), adminController.importStudents);
router.get('/lecturers', adminController.getLecturers);
router.post('/lecturers', validateCreateLecturer, adminController.createLecturer);
router.put('/lecturers/:id', validateId('id'), validateUpdateLecturer, adminController.updateLecturer);
router.delete('/lecturers/:id', validateId('id'), adminController.deleteLecturer);
router.get('/courses', adminController.getCourses);
router.get('/courses/:id/students', validateId('id'), adminController.getCourseStudents);
router.post('/courses', validateCreateCourse, adminController.createCourse);
router.put('/courses/:id', validateUpdateCourse, adminController.updateCourse);
router.delete('/courses/:id', validateId('id'), adminController.deleteCourse);
router.get('/venues', adminController.getVenues);
router.post('/venues', validateCreateVenue, adminController.createVenue);
router.delete('/venues/:id', validateId('id'), adminController.deleteVenue);
router.get('/stats', adminController.getDashboardStats);
router.get('/sessions', adminController.getRecentSessions);

module.exports = router;
