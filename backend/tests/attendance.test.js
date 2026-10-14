const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./setup');

// Mock Bull queue to avoid external Redis connectivity during tests
jest.mock('../src/queues/alertQueue', () => ({
  add: jest.fn().mockResolvedValue(true),
}));

const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Venue = require('../src/models/Venue');
const Session = require('../src/models/Session');
const AttendanceRecord = require('../src/models/AttendanceRecord');
const AuditLog = require('../src/models/AuditLog');
const generateQRToken = require('../src/utils/generateToken');

describe('Attendance Check-in & Geofence Hardening Tests', () => {
  let dbAvailable = false;
  let studentUser;
  let studentToken;
  let lecturerUser;
  let testVenue;
  let testCourse;
  let activeSession;

  beforeAll(async () => {
    dbAvailable = await connectTestDB();
  }, 10000);

  afterAll(async () => {
    if (dbAvailable) {
      await disconnectTestDB();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    await clearTestDB();

    // 1. Create Lecturer
    const lecturerPassword = await bcrypt.hash('LecturerPass123!', 10);
    lecturerUser = await User.create({
      name: 'Prof. Ada Lovelace',
      email: 'ada@university.edu',
      password: lecturerPassword,
      role: 'lecturer',
      department: 'Computer Science',
    });

    // 2. Create Student
    const studentPassword = await bcrypt.hash('StudentPass123!', 10);
    studentUser = await User.create({
      name: 'Habiba Usman',
      email: 'habiba@student.university.edu',
      password: studentPassword,
      role: 'student',
      matricNo: 'CSC/2022/100',
      department: 'Computer Science',
      level: '400',
    });

    studentToken = jwt.sign(
      { id: studentUser._id, role: studentUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    studentUser.activeToken = studentToken;
    await studentUser.save();

    // 3. Create Venue (e.g., Lat: 9.0765, Lng: 7.3986, Radius: 50m)
    testVenue = await Venue.create({
      name: 'Main Computer Lab',
      building: 'Faculty of Science',
      lat: 9.0765,
      lng: 7.3986,
      radiusMetres: 50,
    });

    // 4. Create Course with student enrolled
    testCourse = await Course.create({
      title: 'Advanced Operating Systems',
      code: 'CSC401',
      lecturerId: lecturerUser._id,
      enrolledStudents: [studentUser._id],
      alertThreshold: 75,
    });

    // 5. Create Active Session
    activeSession = await Session.create({
      courseId: testCourse._id,
      venueId: testVenue._id,
      lecturerId: lecturerUser._id,
      isActive: true,
      startedAt: new Date(),
    });
  });

  test('valid attendance check-in succeeds when student is within venue geofence', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const qrToken = await generateQRToken(activeSession._id.toString());

    // Coordinates right inside venue (distance ~ 0 metres)
    const checkInPayload = {
      token: qrToken,
      lat: 9.0765,
      lng: 7.3986,
    };

    const response = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(checkInPayload);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Attendance recorded/i);
    expect(response.body.reason).toBe('present');
    expect(response.body.distanceMetres).toBeLessThanOrEqual(50);

    // Verify record in database
    const savedRecord = await AttendanceRecord.findOne({
      sessionId: activeSession._id,
      studentId: studentUser._id,
    });
    expect(savedRecord).not.toBeNull();
    expect(savedRecord.status).toBe('present');

    // Verify audit log entry
    const audit = await AuditLog.findOne({
      action: 'ATTENDANCE_CHECKIN_SUCCESS',
      actorId: studentUser._id,
    });
    expect(audit).not.toBeNull();
    expect(audit.result).toBe('success');
  });

  test('duplicate attendance check-in for the same student and session returns 409', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const qrToken = await generateQRToken(activeSession._id.toString());

    const checkInPayload = {
      token: qrToken,
      lat: 9.0765,
      lng: 7.3986,
    };

    // First check-in succeeds
    const firstResponse = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(checkInPayload);
    expect(firstResponse.status).toBe(200);

    // Second check-in attempt must return 409 Conflict
    const secondResponse = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(checkInPayload);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.reason).toBe('already_checked_in');
    expect(secondResponse.body.message).toMatch(/already checked in/i);

    // Verify total records in DB is strictly 1
    const recordCount = await AttendanceRecord.countDocuments({
      sessionId: activeSession._id,
      studentId: studentUser._id,
    });
    expect(recordCount).toBe(1);

    // Verify audit log captured failure with reason already_checked_in
    const duplicateAudit = await AuditLog.findOne({
      action: 'ATTENDANCE_CHECKIN_FAILED',
      'metadata.reason': 'already_checked_in',
    });
    expect(duplicateAudit).not.toBeNull();
  });

  test('invalid geofence check-in is rejected (400) without creating an attendance record', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const qrToken = await generateQRToken(activeSession._id.toString());

    // Coordinates far from venue (> 1 km away)
    const checkInPayload = {
      token: qrToken,
      lat: 9.1500, // ~8 km away
      lng: 7.4500,
    };

    const response = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(checkInPayload);

    expect(response.status).toBe(400);
    expect(response.body.reason).toBe('out_of_range');
    expect(response.body.message).toMatch(/Move closer and try again/i);
    expect(response.body.distanceMetres).toBeGreaterThan(50);

    // Ensure NO attendance record was saved in the database
    const savedRecord = await AttendanceRecord.findOne({
      sessionId: activeSession._id,
      studentId: studentUser._id,
    });
    expect(savedRecord).toBeNull();

    // Verify audit log recorded geofence breach failure
    const audit = await AuditLog.findOne({
      action: 'ATTENDANCE_CHECKIN_FAILED',
      'metadata.reason': 'out_of_range',
    });
    expect(audit).not.toBeNull();
  });

  test('tampered QR code token is rejected (400) and recorded in audit log', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const validToken = await generateQRToken(activeSession._id.toString());
    const tamperedToken = validToken.substring(0, validToken.length - 6) + 'abcdef';

    const response = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        token: tamperedToken,
        lat: 9.0765,
        lng: 7.3986,
      });

    expect(response.status).toBe(400);
    expect(response.body.reason).toBe('tampered');

    const audit = await AuditLog.findOne({
      action: 'ATTENDANCE_CHECKIN_FAILED',
      'metadata.reason': 'tampered',
    });
    expect(audit).not.toBeNull();
  });
});
