const AttendanceRecord = require('../models/AttendanceRecord');
const Session          = require('../models/Session');
const Course           = require('../models/Course');
const User             = require('../models/User');
const verifyQRToken    = require('../utils/verifyToken');
const haversineDistance = require('../utils/haversine');
const { getIO }        = require('../config/socket');
const alertQueue       = require('../queues/alertQueue');
const logAudit         = require('../utils/auditLogger');

/**
 * checkIn
 * -------
 * POST /api/attendance/checkin
 * Protected: JWT required. Role: student only.
 *
 * Runs 9 steps in a specific order:
 *   - Token verification first: cheapest rejection
 *   - Session validation & enrollment ownership check
 *   - Duplicate check BEFORE geofence
 *   - Geofence check
 *   - Save record
 *   - Socket.io emit
 *   - Absenteeism queue threshold check
 *   - Audit logs for all failure and success branches
 */
const checkIn = async (req, res) => {
  const { token, lat, lng } = req.body;
  const studentId = req.user._id;

  // ── Input validation ────────────────────────────────────────────────
  if (!token || lat === undefined || lng === undefined) {
    return res.status(400).json({
      message: 'token, lat and lng are required',
      reason: 'validation_error',
    });
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return res.status(400).json({
      message: 'lat and lng must be numbers',
      reason: 'validation_error',
    });
  }

  // ── Step 1: Verify the QR token ─────────────────────────────────────
  const verification = await verifyQRToken(token);

  if (!verification.valid) {
    await logAudit({
      actorId: studentId,
      actorRole: 'student',
      action: 'ATTENDANCE_CHECKIN_FAILED',
      targetType: 'Session',
      result: 'failure',
      metadata: { reason: verification.reason },
    });

    return res.status(400).json({
      message: verification.reason === 'expired'
        ? 'QR code has expired. Ask your lecturer to refresh it.'
        : verification.reason === 'tampered'
        ? 'Invalid QR code.'
        : 'QR code not recognised.',
      reason: verification.reason,
    });
  }

  const { sessionId } = verification;

  // ── Step 2: Load the session and course ──────────────────────────────
  const session = await Session.findById(sessionId).populate('venueId courseId');

  if (!session) {
    await logAudit({
      actorId: studentId,
      actorRole: 'student',
      action: 'ATTENDANCE_CHECKIN_FAILED',
      targetType: 'Session',
      targetId: sessionId,
      result: 'failure',
      metadata: { reason: 'session_not_found' },
    });
    return res.status(404).json({ message: 'Session not found.' });
  }

  if (!session.isActive) {
    await logAudit({
      actorId: studentId,
      actorRole: 'student',
      action: 'ATTENDANCE_CHECKIN_FAILED',
      targetType: 'Session',
      targetId: sessionId,
      result: 'failure',
      metadata: { reason: 'session_inactive' },
    });
    return res.status(400).json({
      message: 'This session has already ended.',
      reason: 'session_ended',
    });
  }

  // Course enrollment check: verify student belongs to this course
  const course = session.courseId;
  if (
    course &&
    course.enrolledStudents &&
    course.enrolledStudents.length > 0 &&
    !course.enrolledStudents.some((id) => id.toString() === studentId.toString())
  ) {
    await logAudit({
      actorId: studentId,
      actorRole: 'student',
      action: 'ATTENDANCE_CHECKIN_FAILED',
      targetType: 'Course',
      targetId: course._id,
      result: 'failure',
      metadata: { reason: 'not_enrolled', sessionId },
    });

    return res.status(403).json({
      message: 'Forbidden: You are not enrolled in this course.',
      reason: 'not_enrolled',
    });
  }

  // ── Step 3: Duplicate check — MUST come before geofence ─────────────
  const existingRecord = await AttendanceRecord.findOne({
    sessionId,
    studentId,
    status: 'present',
  });

  if (existingRecord) {
    await logAudit({
      actorId: studentId,
      actorRole: 'student',
      action: 'ATTENDANCE_CHECKIN_FAILED',
      targetType: 'AttendanceRecord',
      targetId: existingRecord._id,
      result: 'failure',
      metadata: { reason: 'already_checked_in', sessionId },
    });

    return res.status(409).json({
      message: 'You have already checked in for this session.',
      reason: 'already_checked_in',
    });
  }

  // ── Step 4: Geofence check ───────────────────────────────────────────
  const venue = session.venueId;
  const distanceMetres = haversineDistance(
    parsedLat,
    parsedLng,
    venue.lat,
    venue.lng
  );

  if (distanceMetres > venue.radiusMetres) {
    await logAudit({
      actorId: studentId,
      actorRole: 'student',
      action: 'ATTENDANCE_CHECKIN_FAILED',
      targetType: 'Session',
      targetId: sessionId,
      result: 'failure',
      metadata: {
        reason: 'out_of_range',
        distanceMetres,
        radiusMetres: venue.radiusMetres,
      },
    });

    return res.status(400).json({
      message: `You are ${Math.round(distanceMetres)}m from the venue. Move closer and try again.`,
      reason: 'out_of_range',
      distanceMetres,
      radiusMetres: venue.radiusMetres,
    });
  }

  // ── Step 5: Save the attendance record ──────────────────────────────
  const record = await AttendanceRecord.create({
    sessionId,
    studentId,
    lat: parsedLat,
    lng: parsedLng,
    distanceMetres,
    status: 'present',
    checkedInAt: new Date(),
  });

  // ── Step 6: Populate student details for Socket.io payload ──────────
  const student = await User.findById(studentId).select('name matricNo');

  // ── Step 7: Emit real-time update to lecturer's dashboard ───────────
  try {
    getIO().to(sessionId.toString()).emit('attendance:new', {
      studentId:  studentId.toString(),
      name:       student.name,
      matricNo:   student.matricNo,
      checkedInAt: record.checkedInAt,
      distanceMetres,
    });
  } catch (socketErr) {
    console.error('Socket emit failed (non-fatal):', socketErr.message);
  }

  // ── Step 8: Check absenteeism threshold and queue alert if needed ────
  try {
    const totalSessions = await Session.countDocuments({
      courseId: course._id,
      isActive: false,
    });

    const total = totalSessions + 1;

    if (total > 0) {
      const attended = await AttendanceRecord.countDocuments({
        studentId,
        status: 'present',
        sessionId: {
          $in: await Session.find({ courseId: course._id }).distinct('_id'),
        },
      });

      const percentage = Math.round((attended / total) * 100);

      if (percentage < course.alertThreshold) {
        const lecturer = await User.findById(session.lecturerId).select('email');

        await alertQueue.add({
          studentEmail:  student.email || '',
          studentName:   student.name,
          courseName:    course.title,
          courseCode:    course.code,
          percentage,
          threshold:     course.alertThreshold,
          lecturerEmail: lecturer?.email || '',
        });
      }
    }
  } catch (alertErr) {
    console.error('Alert queue error (non-fatal):', alertErr.message);
  }

  // ── Step 9: Audit log success and return response ───────────────────
  await logAudit({
    actorId: studentId,
    actorRole: 'student',
    action: 'ATTENDANCE_CHECKIN_SUCCESS',
    targetType: 'AttendanceRecord',
    targetId: record._id,
    result: 'success',
    metadata: {
      sessionId,
      distanceMetres,
      courseId: course._id,
    },
  });

  return res.status(200).json({
    message: 'Attendance recorded.',
    reason: 'present',
    distanceMetres,
    checkedInAt: record.checkedInAt,
  });
};

/**
 * getMyAttendance
 * ---------------
 * GET /api/attendance/my-history
 * Protected: JWT required. Role: student only.
 * Ensures students can only access their own attendance records.
 */
const getMyAttendance = async (req, res) => {
  const records = await AttendanceRecord.find({
    studentId: req.user._id,
    status: 'present',
  })
    .populate({
      path: 'sessionId',
      populate: [
        { path: 'courseId', select: 'title code' },
        { path: 'venueId', select: 'name building' },
      ],
    })
    .sort({ checkedInAt: -1 });

  return res.status(200).json(records);
};

module.exports = {
  checkIn,
  getMyAttendance,
};
