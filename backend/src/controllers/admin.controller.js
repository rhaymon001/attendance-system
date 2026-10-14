const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const Venue = require('../models/Venue');
const Session = require('../models/Session');
const AttendanceRecord = require('../models/AttendanceRecord');
const QRToken = require('../models/QRToken');
const parseCSV = require('../utils/csvParser');
const logAudit = require('../utils/auditLogger');

const publicUserFields = 'name email role matricNo department level createdAt';

const getStudents = async (req, res) => {
  const students = await User.find({ role: 'student' })
    .select(publicUserFields)
    .sort({ name: 1 });
  return res.status(200).json(students);
};

const createStudent = async (req, res) => {
  const { name, email, matricNo, department, level, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    return res.status(409).json({ message: 'Email is already registered', reason: 'duplicate_email' });
  }

  const student = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password || 'password123', 10),
    role: 'student',
    matricNo: matricNo.trim(),
    department: department.trim(),
    level: String(level),
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_CREATE_STUDENT',
    targetType: 'User',
    targetId: student._id,
    result: 'success',
    metadata: { email: student.email, matricNo: student.matricNo },
  });

  return res.status(201).json(await User.findById(student._id).select(publicUserFields));
};

const updateStudent = async (req, res) => {
  const fields = ['name', 'email', 'matricNo', 'department', 'level'];
  const updates = Object.fromEntries(fields
    .filter((field) => req.body[field] !== undefined)
    .map((field) => [field, field === 'email' ? req.body[field].trim().toLowerCase() : req.body[field].trim()]));

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    { $set: updates },
    { new: true, runValidators: true }
  ).select(publicUserFields);

  if (!student) return res.status(404).json({ message: 'Student not found', reason: 'resource_not_found' });
  return res.status(200).json(student);
};

const deleteStudent = async (req, res) => {
  const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found', reason: 'resource_not_found' });

  await Course.updateMany({ enrolledStudents: student._id }, { $pull: { enrolledStudents: student._id } });
  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_DELETE_STUDENT',
    targetType: 'User',
    targetId: student._id,
    result: 'success',
    metadata: { email: student.email },
  });

  return res.status(200).json({ message: 'Student deleted successfully' });
};

const getLecturers = async (req, res) => {
  const lecturers = await User.find({ role: 'lecturer' })
    .select(publicUserFields)
    .sort({ name: 1 })
    .lean();
  const courseCounts = await Course.aggregate([
    { $group: { _id: '$lecturerId', count: { $sum: 1 } } },
  ]);
  const counts = new Map(courseCounts.map(({ _id, count }) => [_id.toString(), count]));

  return res.status(200).json(lecturers.map((lecturer) => ({
    ...lecturer,
    coursesCount: counts.get(lecturer._id.toString()) || 0,
  })));
};

const updateLecturer = async (req, res) => {
  const updates = {};
  for (const field of ['name', 'email', 'department']) {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'email' ? req.body[field].trim().toLowerCase() : req.body[field].trim();
    }
  }

  const lecturer = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'lecturer' },
    { $set: updates },
    { new: true, runValidators: true }
  ).select(publicUserFields);

  if (!lecturer) return res.status(404).json({ message: 'Lecturer not found', reason: 'resource_not_found' });
  return res.status(200).json(lecturer);
};

const deleteLecturer = async (req, res) => {
  const hasCourses = await Course.exists({ lecturerId: req.params.id });
  if (hasCourses) {
    return res.status(409).json({
      message: 'Reassign or delete this lecturer’s courses before deleting the account.',
      reason: 'lecturer_has_courses',
    });
  }

  const lecturer = await User.findOneAndDelete({ _id: req.params.id, role: 'lecturer' });
  if (!lecturer) return res.status(404).json({ message: 'Lecturer not found', reason: 'resource_not_found' });
  return res.status(200).json({ message: 'Lecturer deleted successfully' });
};

const getCourses = async (req, res) => {
  const courses = await Course.find()
    .populate('lecturerId', 'name email department')
    .populate('enrolledStudents', 'name email matricNo department level')
    .sort({ code: 1 });
  return res.status(200).json(courses);
};

const getCourseStudents = async (req, res) => {
  const course = await Course.findById(req.params.id).populate(
    'enrolledStudents',
    'name email matricNo department level'
  );
  if (!course) return res.status(404).json({ message: 'Course not found', reason: 'resource_not_found' });
  return res.status(200).json(course.enrolledStudents);
};

const deleteCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found', reason: 'resource_not_found' });

  const sessions = await Session.find({ courseId: course._id }).select('_id');
  const sessionIds = sessions.map(({ _id }) => _id);
  await Promise.all([
    AttendanceRecord.deleteMany({ sessionId: { $in: sessionIds } }),
    QRToken.deleteMany({ sessionId: { $in: sessionIds } }),
    Session.deleteMany({ _id: { $in: sessionIds } }),
    course.deleteOne(),
  ]);

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_DELETE_COURSE',
    targetType: 'Course',
    targetId: course._id,
    result: 'success',
    metadata: { code: course.code, deletedSessions: sessionIds.length },
  });
  return res.status(200).json({ message: 'Course and its session data deleted successfully' });
};

const getVenues = async (req, res) => {
  const venues = await Venue.find().sort({ name: 1 });
  return res.status(200).json(venues);
};

const deleteVenue = async (req, res) => {
  const hasSessions = await Session.exists({ venueId: req.params.id });
  if (hasSessions) {
    return res.status(409).json({ message: 'Venue is used by sessions and cannot be deleted.', reason: 'venue_in_use' });
  }
  const venue = await Venue.findByIdAndDelete(req.params.id);
  if (!venue) return res.status(404).json({ message: 'Venue not found', reason: 'resource_not_found' });
  return res.status(200).json({ message: 'Venue deleted successfully' });
};

const getRecentSessions = async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 5, 1), 50);
  const sessions = await Session.find()
    .populate('courseId', 'code title')
    .populate('lecturerId', 'name email')
    .populate('venueId', 'name building')
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();

  const counts = await Promise.all(sessions.map(({ _id }) =>
    AttendanceRecord.countDocuments({ sessionId: _id, status: 'present' })
  ));

  return res.status(200).json(sessions.map((session, index) => ({
    ...session,
    attendanceCount: counts[index],
  })));
};

/**
 * importStudents
 * --------------
 * POST /api/admin/students/import (multipart)
 * - Receive CSV file (multipart) → parseCSV
 * - For each row: bcrypt.hash default password → User.create
 * - Return { created: N, skipped: M }
 * - Records audit log of bulk operation
 */
const importStudents = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({
      message: 'CSV file is required',
      reason: 'validation_error',
    });
  }

  const rows = await parseCSV(req.file.buffer);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = (row.email || '').trim().toLowerCase();

    if (!email || !row.name) {
      skipped++;
      continue;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      skipped++;
      continue;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    await User.create({
      name: row.name.trim(),
      email,
      password: hashedPassword,
      role: 'student',
      matricNo: row.matricNo ? row.matricNo.trim() : undefined,
      department: row.department ? row.department.trim() : undefined,
      level: row.level ? row.level.trim() : undefined,
    });

    created++;
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_IMPORT_STUDENTS',
    targetType: 'User',
    result: 'success',
    metadata: {
      totalRows: rows.length,
      createdCount: created,
      skippedCount: skipped,
    },
  });

  return res.status(200).json({ created, skipped });
};

/**
 * createLecturer
 * --------------
 * POST /api/admin/lecturers
 */
const createLecturer = async (req, res) => {
  const { name, email, password, department } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({
      message: 'Email is already registered',
      reason: 'duplicate_email',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const lecturer = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: 'lecturer',
    department: department ? department.trim() : undefined,
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_CREATE_LECTURER',
    targetType: 'User',
    targetId: lecturer._id,
    result: 'success',
    metadata: {
      email: lecturer.email,
      department: lecturer.department,
    },
  });

  return res.status(201).json(lecturer);
};

/**
 * createCourse
 * ------------
 * POST /api/admin/courses
 */
const createCourse = async (req, res) => {
  const { title, code, lecturerId, enrolledStudents, alertThreshold } = req.body;

  // Validate assigned lecturer exists
  const lecturer = await User.findOne({ _id: lecturerId, role: 'lecturer' });
  if (!lecturer) {
    return res.status(404).json({
      message: 'Assigned lecturer not found',
      reason: 'resource_not_found',
    });
  }

  const course = await Course.create({
    title: title.trim(),
    code: code.trim().toUpperCase(),
    lecturerId,
    enrolledStudents: enrolledStudents || [],
    alertThreshold: alertThreshold !== undefined ? Number(alertThreshold) : 75,
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_CREATE_COURSE',
    targetType: 'Course',
    targetId: course._id,
    result: 'success',
    metadata: {
      code: course.code,
      lecturerId: course.lecturerId,
      alertThreshold: course.alertThreshold,
    },
  });

  return res.status(201).json(course);
};

/**
 * updateCourse
 * ------------
 * PUT /api/admin/courses/:id
 * Enrol/remove students or update course details
 */
const updateCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const { studentId, removeStudentId, enrolledStudents, lecturerId, title, code, alertThreshold } = req.body;

  if (studentId || removeStudentId) {
    const targetStudentId = studentId || removeStudentId;
    const targetStudent = await User.findOne({ _id: targetStudentId, role: 'student' });
    if (!targetStudent) {
      return res.status(404).json({ message: 'Student not found', reason: 'resource_not_found' });
    }
    if (studentId) {
      if (!course.enrolledStudents.some((id) => id.toString() === studentId)) {
        course.enrolledStudents.push(targetStudent._id);
      }
    } else {
      course.enrolledStudents = course.enrolledStudents.filter((id) => id.toString() !== removeStudentId);
    }
  }

  if (enrolledStudents !== undefined) course.enrolledStudents = enrolledStudents;
  if (lecturerId !== undefined) {
    const lecturer = await User.findOne({ _id: lecturerId, role: 'lecturer' });
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found', reason: 'resource_not_found' });
    course.lecturerId = lecturerId;
  }
  if (title !== undefined) course.title = title.trim();
  if (code !== undefined) course.code = code.trim().toUpperCase();
  if (alertThreshold !== undefined) course.alertThreshold = Number(alertThreshold);
  await course.save();

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_UPDATE_COURSE',
    targetType: 'Course',
    targetId: course._id,
    result: 'success',
    metadata: {
      updatedFields: Object.keys(req.body),
    },
  });

  return res.status(200).json(await Course.findById(course._id)
    .populate('lecturerId', 'name email department')
    .populate('enrolledStudents', 'name email matricNo department level'));
};

/**
 * createVenue
 * -----------
 * POST /api/admin/venues
 */
const createVenue = async (req, res) => {
  const { name, building, lat, lng, radiusMetres } = req.body;

  const venue = await Venue.create({
    name: name.trim(),
    building: building ? building.trim() : undefined,
    lat: Number(lat),
    lng: Number(lng),
    radiusMetres: radiusMetres !== undefined ? Number(radiusMetres) : 50,
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_CREATE_VENUE',
    targetType: 'Venue',
    targetId: venue._id,
    result: 'success',
    metadata: {
      name: venue.name,
      lat: venue.lat,
      lng: venue.lng,
      radiusMetres: venue.radiusMetres,
    },
  });

  return res.status(201).json(venue);
};

/**
 * getDashboardStats
 * -----------------
 * GET /api/admin/stats
 * Counts: users, sessions, records
 */
const getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalLecturers,
    totalSessions,
    activeSessions,
    totalRecords,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'lecturer' }),
    Session.countDocuments(),
    Session.countDocuments({ isActive: true }),
    AttendanceRecord.countDocuments(),
  ]);

  return res.status(200).json({
    totalUsers,
    totalStudents,
    totalLecturers,
    totalSessions,
    activeSessions,
    totalRecords,
  });
};

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getLecturers,
  importStudents,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  getCourses,
  getCourseStudents,
  createCourse,
  updateCourse,
  deleteCourse,
  getVenues,
  deleteVenue,
  getRecentSessions,
  createVenue,
  getDashboardStats,
};
