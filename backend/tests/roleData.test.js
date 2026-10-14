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

const createUserWithToken = async (role, email) => {
  const user = await User.create({
    name: `${role} test user`,
    email,
    password: await bcrypt.hash('Password123!', 10),
    role,
    matricNo: role === 'student' ? `TEST-${email}` : undefined,
  });
  const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  user.activeToken = token;
  await user.save();
  return { user, token };
};

describe('role data API contracts', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await connectTestDB();
  }, 10000);

  afterAll(async () => {
    if (dbAvailable) await disconnectTestDB();
  });

  beforeEach(async () => {
    if (dbAvailable) await clearTestDB();
  });

  test('admin list endpoints return role-specific users without auth secrets', async () => {
    if (!dbAvailable) return;
    const { token } = await createUserWithToken('admin', 'admin@role-tests.local');
    await createUserWithToken('student', 'student@role-tests.local');
    await createUserWithToken('lecturer', 'lecturer@role-tests.local');

    const students = await request(app)
      .get('/api/admin/students')
      .set('Authorization', `Bearer ${token}`);
    expect(students.status).toBe(200);
    expect(students.body).toHaveLength(1);
    expect(students.body[0].role).toBe('student');
    expect(students.body[0].password).toBeUndefined();
    expect(students.body[0].activeToken).toBeUndefined();

    const lecturers = await request(app)
      .get('/api/admin/lecturers')
      .set('Authorization', `Bearer ${token}`);
    expect(lecturers.status).toBe(200);
    expect(lecturers.body).toHaveLength(1);
    expect(lecturers.body[0].role).toBe('lecturer');
  });

  test('student courses endpoint scopes enrollment and attendance summary to the caller', async () => {
    if (!dbAvailable) return;
    const { user: lecturer } = await createUserWithToken('lecturer', 'owner@role-tests.local');
    const { user: student, token } = await createUserWithToken('student', 'enrolled@role-tests.local');
    const { user: otherStudent } = await createUserWithToken('student', 'other@role-tests.local');
    const venue = await Venue.create({ name: 'Test Hall', lat: 10, lng: 7 });
    const enrolledCourse = await Course.create({
      title: 'Test Course',
      code: 'TST101',
      lecturerId: lecturer._id,
      enrolledStudents: [student._id],
    });
    await Course.create({
      title: 'Other Course',
      code: 'TST102',
      lecturerId: lecturer._id,
      enrolledStudents: [otherStudent._id],
    });
    const session = await Session.create({
      courseId: enrolledCourse._id,
      lecturerId: lecturer._id,
      venueId: venue._id,
      isActive: false,
      startedAt: new Date('2026-09-01T09:00:00.000Z'),
      endedAt: new Date('2026-09-01T10:00:00.000Z'),
    });
    await AttendanceRecord.create({
      sessionId: session._id,
      studentId: student._id,
      lat: 10,
      lng: 7,
      distanceMetres: 0,
      status: 'present',
    });

    const response = await request(app)
      .get('/api/student/courses')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(enrolledCourse._id.toString());
    expect(response.body[0].totalSessions).toBe(1);
    expect(response.body[0].attended).toBe(1);
    expect(response.body[0].history[0].status).toBe('present');
  });

  test('lecturer course list returns only courses assigned to that lecturer', async () => {
    if (!dbAvailable) return;
    const { user: lecturerA, token } = await createUserWithToken('lecturer', 'lecturer-a@role-tests.local');
    const { user: lecturerB } = await createUserWithToken('lecturer', 'lecturer-b@role-tests.local');
    await Course.create({ title: 'Owned', code: 'OWN101', lecturerId: lecturerA._id });
    await Course.create({ title: 'Not owned', code: 'OTH101', lecturerId: lecturerB._id });

    const response = await request(app)
      .get('/api/lecturer/courses')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.map(({ code }) => code)).toEqual(['OWN101']);
  });
});
