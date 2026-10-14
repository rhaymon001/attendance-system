const Session = require('../models/Session');
const Course = require('../models/Course');
const Venue = require('../models/Venue');
const AttendanceRecord = require('../models/AttendanceRecord');
const generateQRToken = require('../utils/generateToken');
const logAudit = require('../utils/auditLogger');

const getSessions = async (req, res) => {
  const { courseId, active } = req.query;
  const filter = { lecturerId: req.user._id };

  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found', reason: 'resource_not_found' });
    if (course.lecturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this course', reason: 'forbidden_ownership' });
    }
    filter.courseId = course._id;
  }

  if (active !== undefined) {
    if (!['true', 'false'].includes(active)) {
      return res.status(400).json({ message: 'active must be true or false', reason: 'validation_error' });
    }
    filter.isActive = active === 'true';
  }

  const sessions = await Session.find(filter)
    .populate('courseId', 'code title')
    .populate('venueId', 'name building radiusMetres')
    .sort({ startedAt: -1 })
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
 * createSession
 * -------------
 * POST /api/sessions
 * Protected: JWT required. Role: lecturer.
 * - Validates course and venue existence
 * - Enforces course ownership (lecturer must be assigned to the course)
 * - Creates Session doc (isActive: true)
 * - Generates first QR token
 */
const createSession = async (req, res) => {
  const { courseId, venueId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  // Ownership check: lecturer must be assigned to the course
  if (req.user.role !== 'admin' && course.lecturerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Forbidden: You do not own this course',
      reason: 'forbidden_ownership',
    });
  }

  const venue = await Venue.findById(venueId);
  if (!venue) {
    return res.status(404).json({ message: 'Venue not found' });
  }

  const session = await Session.create({
    courseId,
    venueId,
    lecturerId: req.user._id,
    isActive: true,
    startedAt: new Date(),
  });

  const token = await generateQRToken(session._id.toString());

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'SESSION_CREATE',
    targetType: 'Session',
    targetId: session._id,
    result: 'success',
    metadata: { courseId, venueId },
  });

  const populatedSession = await Session.findById(session._id)
    .populate('courseId', 'code title')
    .populate('venueId', 'name building radiusMetres');

  return res.status(201).json({
    session: populatedSession,
    token,
  });
};

/**
 * generateQR
 * ----------
 * GET /api/sessions/:id/qr
 * Protected: JWT required. Role: lecturer.
 * - Verify session exists and isActive
 * - Enforces session ownership: lecturerId === req.user._id
 * - Calls generateToken → returns new token string
 */
const generateQR = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  // Ownership check: only session owner (or admin) can generate QR codes
  if (req.user.role !== 'admin' && session.lecturerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Forbidden: You do not own this session',
      reason: 'forbidden_ownership',
    });
  }

  if (!session.isActive) {
    return res.status(400).json({ message: 'Session is not active' });
  }

  const token = await generateQRToken(session._id.toString());

  return res.status(200).json({ token });
};

/**
 * getSessionAttendance
 * --------------------
 * GET /api/sessions/:id/attendance
 * Protected: JWT required. Role: lecturer.
 * - Verify session exists
 * - Enforces session ownership: lecturerId === req.user._id
 * - AttendanceRecord.find({ sessionId }).populate('studentId', 'name matricNo email')
 */
const getSessionAttendance = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  // Ownership check
  if (req.user.role !== 'admin' && session.lecturerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Forbidden: You do not own this session',
      reason: 'forbidden_ownership',
    });
  }

  const records = await AttendanceRecord.find({ sessionId: req.params.id })
    .populate('studentId', 'name matricNo email');

  return res.status(200).json(records);
};

/**
 * endSession
 * ----------
 * PATCH /api/sessions/:id/end
 * Protected: JWT required. Role: lecturer.
 * - Verify session exists
 * - Enforces session ownership
 * - Updates isActive: false, endedAt: Date.now()
 * - Audit logs the session end event
 */
const endSession = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  // Ownership check
  if (req.user.role !== 'admin' && session.lecturerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Forbidden: You do not own this session',
      reason: 'forbidden_ownership',
    });
  }

  session.isActive = false;
  session.endedAt = new Date();
  await session.save();

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'SESSION_END',
    targetType: 'Session',
    targetId: session._id,
    result: 'success',
    metadata: { courseId: session.courseId },
  });

  return res.status(200).json(session);
};

module.exports = {
  getSessions,
  createSession,
  generateQR,
  getSessionAttendance,
  endSession,
};
