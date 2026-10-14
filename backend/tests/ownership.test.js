const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./setup');

const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Venue = require('../src/models/Venue');
const Session = require('../src/models/Session');
const AttendanceRecord = require('../src/models/AttendanceRecord');

describe('Ownership Authorization & Resource Boundary Tests', () => {
  let dbAvailable = false;
  let lecturerA;
  let tokenA;
  let lecturerB;
  let tokenB;
  let studentUser;
  let studentToken;
  let testVenue;
  let courseA;
  let sessionA;

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

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Lecturer A
    lecturerA = await User.create({
      name: 'Lecturer Alpha',
      email: 'alpha@university.edu',
      password: hashedPassword,
      role: 'lecturer',
      department: 'Mathematics',
    });
    tokenA = jwt.sign({ id: lecturerA._id, role: lecturerA.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    lecturerA.activeToken = tokenA;
    await lecturerA.save();

    // Lecturer B
    lecturerB = await User.create({
      name: 'Lecturer Beta',
      email: 'beta@university.edu',
      password: hashedPassword,
      role: 'lecturer',
      department: 'Physics',
    });
    tokenB = jwt.sign({ id: lecturerB._id, role: lecturerB.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    lecturerB.activeToken = tokenB;
    await lecturerB.save();

    // Student
    studentUser = await User.create({
      name: 'Student One',
      email: 'student1@university.edu',
      password: hashedPassword,
      role: 'student',
      matricNo: 'MAT/2022/01',
    });
    studentToken = jwt.sign({ id: studentUser._id, role: studentUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    studentUser.activeToken = studentToken;
    await studentUser.save();

    // Venue
    testVenue = await Venue.create({
      name: 'Hall 1',
      lat: 10.0,
      lng: 7.0,
      radiusMetres: 50,
    });

    // Course owned by Lecturer A
    courseA = await Course.create({
      title: 'Linear Algebra',
      code: 'MTH201',
      lecturerId: lecturerA._id,
      enrolledStudents: [studentUser._id],
    });

    // Session owned by Lecturer A
    sessionA = await Session.create({
      courseId: courseA._id,
      venueId: testVenue._id,
      lecturerId: lecturerA._id,
      isActive: true,
      startedAt: new Date(),
    });
  });

  test('Invalid MongoDB ObjectId parameter returns 400 Bad Request with structured message', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const jwt = require('jsonwebtoken');
    const dummyLecturerToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', role: 'lecturer' },
      process.env.JWT_SECRET || 'test_jwt_secret_key_hardening_12345'
    );

    const response = await request(app)
      .get('/api/sessions/not-a-valid-object-id/attendance')
      .set('Authorization', `Bearer ${dummyLecturerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.reason).toBe('invalid_id');
    expect(response.body.message).toMatch(/Invalid id format/i);
  });

  test('Lecturer B cannot access session attendance for session owned by Lecturer A (403)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const response = await request(app)
      .get(`/api/sessions/${sessionA._id}/attendance`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/do not own this session/i);
    expect(response.body.reason).toBe('forbidden_ownership');
  });

  test('Lecturer B cannot end session owned by Lecturer A (403)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const response = await request(app)
      .patch(`/api/sessions/${sessionA._id}/end`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/do not own this session/i);
  });

  test('Lecturer B cannot access report stats for course owned by Lecturer A (403)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const response = await request(app)
      .get(`/api/reports/${courseA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/do not own this course/i);
    expect(response.body.reason).toBe('forbidden_ownership');
  });

  test('Lecturer B cannot export CSV or PDF report for course owned by Lecturer A (403)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const csvResponse = await request(app)
      .get(`/api/reports/${courseA._id}/export/csv`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(csvResponse.status).toBe(403);

    const pdfResponse = await request(app)
      .get(`/api/reports/${courseA._id}/export/pdf`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(pdfResponse.status).toBe(403);
  });

  test('Student can only view their own attendance history', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    // Attendance record for Student One
    await AttendanceRecord.create({
      sessionId: sessionA._id,
      studentId: studentUser._id,
      lat: 10.0,
      lng: 7.0,
      distanceMetres: 12,
      status: 'present',
    });

    const response = await request(app)
      .get('/api/attendance/my-history')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].studentId.toString()).toBe(studentUser._id.toString());
  });
});
