const AttendanceRecord = require('../models/AttendanceRecord');
const Session          = require('../models/Session');
const Course           = require('../models/Course');
const User             = require('../models/User');
const verifyQRToken    = require('../utils/verifyToken');
const haversineDistance = require('../utils/haversine');
const { getIO }        = require('../config/socket');
const alertQueue       = require('../queues/alertQueue');

/**
 * checkIn
 * -------
 * POST /api/attendance/checkin
 * Protected: JWT required. Role: student only.
 *
 * This is the most critical route in the system. It runs 9 steps
 * in a specific order. The order matters — do not rearrange.
 *
 * Request body:
 *   { token: string, lat: number, lng: number }
 *
 * Step order rationale:
 *   - Token verification first: cheapest rejection (no DB read for attendance)
 *   - Duplicate check BEFORE geofence: prevents writing a spurious
 *     'rejected' record for a student who already has a 'present' record
 *     but whose GPS drifted on a second attempt
 *   - Geofence check after duplicate: only meaningful for first-time check-ins
 *   - Socket.io emit before queue: live dashboard updates immediately,
 *     email alert is background / non-blocking
 */
const checkIn = async (req, res) => {
  const { token, lat, lng } = req.body;
  const studentId = req.user._id;

  // ── Input validation ────────────────────────────────────────────────
  if (!token || lat === undefined || lng === undefined) {
    return res.status(400).json({
      message: 'token, lat and lng are required',
    });
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return res.status(400).json({ message: 'lat and lng must be numbers' });
  }

  // ── Step 1: Verify the QR token ─────────────────────────────────────
  // Checks: HMAC signature → expiry → DB existence
  // Does NOT mark the token as used — it stays valid for the full
  // 2-minute window so the whole class can scan the same code.
  const verification = await verifyQRToken(token);

  if (!verification.valid) {
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

  // ── Step 2: Load the session ─────────────────────────────────────────
  const session = await Session.findById(sessionId).populate('venueId courseId');

  if (!session) {
    return res.status(404).json({ message: 'Session not found.' });
  }

  if (!session.isActive) {
    return res.status(400).json({ message: 'This session has already ended.' });
  }

  // ── Step 3: Duplicate check — MUST come before geofence ─────────────
  // If the student already has a 'present' record for this session,
  // reject immediately. This prevents:
  //   (a) double check-ins
  //   (b) writing a spurious 'rejected' record if their GPS drifts
  //       and they accidentally scan again
  const existingRecord = await AttendanceRecord.findOne({
    sessionId,
    studentId,
    status: 'present',
  });

  if (existingRecord) {
    return res.status(409).json({
      message: 'You have already checked in for this session.',
      reason: 'already_checked_in',
    });
  }

  // ── Step 4: Geofence check ───────────────────────────────────────────
  // Compute great-circle distance between student and venue
  const venue = session.venueId;
  const distanceMetres = haversineDistance(
    parsedLat,
    parsedLng,
    venue.lat,
    venue.lng
  );

  if (distanceMetres > venue.radiusMetres) {
    // Do NOT save a rejected AttendanceRecord here.
    // Recording GPS rejections pollutes attendance data with noise
    // from drift or honest mistakes. Only save confirmed check-ins.
    return res.status(400).json({
      message: `You are ${Math.round(distanceMetres)}m from the venue. Move closer and try again.`,
      reason: 'out_of_range',
      distanceMetres,
      radiusMetres: venue.radiusMetres,
    });
  }

  // ── Step 5: Save the attendance record ──────────────────────────────
  // The unique compound index { sessionId, studentId } on
  // AttendanceRecords is the hard DB-level guard against any
  // race-condition duplicates that slip past Step 3.
  const record = await AttendanceRecord.create({
    sessionId,
    studentId,
    lat: parsedLat,
    lng: parsedLng,
    distanceMetres,
    status: 'present',
    checkedInAt: new Date(),
  });

  // ── Step 6: Populate student details for the Socket.io payload ──────
  const student = await User.findById(studentId).select('name matricNo');

  // ── Step 7: Emit real-time update to lecturer's dashboard ───────────
  // The lecturer's SessionView.vue is listening for 'attendance:new'
  // on the room named after this sessionId.
  try {
    getIO().to(sessionId.toString()).emit('attendance:new', {
      studentId:  studentId.toString(),
      name:       student.name,
      matricNo:   student.matricNo,
      checkedInAt: record.checkedInAt,
      distanceMetres,
    });
  } catch (socketErr) {
    // Socket failure is non-fatal — attendance is already saved.
    // Log it but do not fail the request.
    console.error('Socket emit failed (non-fatal):', socketErr.message);
  }

  // ── Step 8: Check absenteeism threshold and queue alert if needed ────
  try {
    const course = session.courseId;

    // Count total sessions for this course
    const totalSessions = await Session.countDocuments({
      courseId: course._id,
      isActive: false, // only count completed sessions
    });

    // Add 1 for the current session (which is still active)
    const total = totalSessions + 1;

    if (total > 0) {
      // Count how many sessions this student attended for this course
      const attended = await AttendanceRecord.countDocuments({
        studentId,
        status: 'present',
        // Only records from sessions of this course
        sessionId: {
          $in: await Session.find({ courseId: course._id }).distinct('_id'),
        },
      });

      const percentage = Math.round((attended / total) * 100);

      // Queue an alert if below threshold
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
    // Alert failure is non-fatal — attendance is saved, dashboard updated.
    console.error('Alert queue error (non-fatal):', alertErr.message);
  }

  // ── Step 9: Return success to student ───────────────────────────────
  return res.status(200).json({
    message: 'Attendance recorded.',
    reason: 'present',
    distanceMetres,
    checkedInAt: record.checkedInAt,
  });
};

module.exports = { checkIn };
