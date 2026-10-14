const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Venue = require('../src/models/Venue');
const Session = require('../src/models/Session');
const AttendanceRecord = require('../src/models/AttendanceRecord');
const generateQRToken = require('../src/utils/generateToken');

const DEFAULT_PASSWORD = 'Password123!';
const DEMO_VENUE = {
  name: 'ETF Hall 2 (Demo)',
  building: 'ETF Hall',
  lat: 6.5244,
  lng: 3.3792,
  radiusMetres: 75,
};

const profileFixtures = [
  {
    name: 'Habiba Admin',
    email: 'admin@habiba.local',
    role: 'admin',
    department: 'Administration',
  },
  {
    name: 'Dr. Ada Johnson',
    email: 'lecturer@habiba.local',
    role: 'lecturer',
    department: 'Computer Science',
  },
  {
    name: 'Dr. Chika Okafor',
    email: 'lecturer2@habiba.local',
    role: 'lecturer',
    department: 'Statistics',
  },
  {
    name: 'Aisha Bello',
    email: 'student1@habiba.local',
    role: 'student',
    department: 'Computer Science',
    matricNo: 'CS/2024/001',
    level: '300',
  },
  {
    name: 'Kehinde Salami',
    email: 'student2@habiba.local',
    role: 'student',
    department: 'Computer Science',
    matricNo: 'CS/2024/002',
    level: '300',
  },
  {
    name: 'Maryam Yusuf',
    email: 'student3@habiba.local',
    role: 'student',
    department: 'Statistics',
    matricNo: 'ST/2024/015',
    level: '200',
  },
  {
    name: 'Samuel Eze',
    email: 'student4@habiba.local',
    role: 'student',
    department: 'Computer Science',
    matricNo: 'CS/2024/004',
    level: '300',
  },
  {
    name: 'Zainab Musa',
    email: 'student5@habiba.local',
    role: 'student',
    department: 'Statistics',
    matricNo: 'ST/2024/022',
    level: '200',
  },
];

const courseFixtures = [
  {
    code: 'CSC407',
    title: 'Data Communication & Networks',
    lecturerEmail: 'lecturer@habiba.local',
    studentEmails: [
      'student1@habiba.local',
      'student2@habiba.local',
      'student3@habiba.local',
      'student4@habiba.local',
    ],
  },
  {
    code: 'CSC411',
    title: 'Database Systems',
    lecturerEmail: 'lecturer@habiba.local',
    studentEmails: [
      'student1@habiba.local',
      'student2@habiba.local',
      'student4@habiba.local',
    ],
  },
  {
    code: 'STA201',
    title: 'Applied Statistics',
    lecturerEmail: 'lecturer2@habiba.local',
    studentEmails: [
      'student3@habiba.local',
      'student5@habiba.local',
    ],
  },
];

const sessionFixtures = [
  { courseCode: 'CSC407', startedAt: '2026-09-07T09:00:00.000Z', present: ['student1@habiba.local', 'student2@habiba.local', 'student3@habiba.local'] },
  { courseCode: 'CSC407', startedAt: '2026-09-14T09:00:00.000Z', present: ['student1@habiba.local', 'student2@habiba.local'] },
  { courseCode: 'CSC407', startedAt: '2026-09-21T09:00:00.000Z', present: ['student1@habiba.local'] },
  { courseCode: 'CSC407', startedAt: '2026-10-14T09:00:00.000Z', active: true, present: ['student1@habiba.local'] },
  { courseCode: 'CSC411', startedAt: '2026-09-10T11:00:00.000Z', present: ['student1@habiba.local', 'student2@habiba.local'] },
  { courseCode: 'CSC411', startedAt: '2026-09-17T11:00:00.000Z', present: ['student2@habiba.local', 'student4@habiba.local'] },
  { courseCode: 'STA201', startedAt: '2026-09-12T13:00:00.000Z', present: ['student3@habiba.local'] },
];

const requireSeedOptIn = () => {
  if (process.env.SEED_DEMO_DATA !== 'YES') {
    throw new Error('Refusing to write demo data. Set SEED_DEMO_DATA=YES to confirm.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seeding is disabled when NODE_ENV=production.');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required. Configure it locally before running the seed command.');
  }
  if (!process.env.HMAC_SECRET) {
    throw new Error('HMAC_SECRET is required to create a valid active-session QR token.');
  }
};

const seedDemoData = async () => {
  requireSeedOptIn();
  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const usersByEmail = new Map();

  for (const profile of profileFixtures) {
    const email = profile.email.toLowerCase();
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          ...profile,
          email,
          password,
          activeToken: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    usersByEmail.set(email, user);
  }

  const venue = await Venue.findOneAndUpdate(
    { name: DEMO_VENUE.name },
    { $set: DEMO_VENUE },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const coursesByCode = new Map();
  for (const fixture of courseFixtures) {
    const lecturer = usersByEmail.get(fixture.lecturerEmail);
    const enrolledStudents = fixture.studentEmails.map((email) => usersByEmail.get(email)._id);
    const course = await Course.findOneAndUpdate(
      { code: fixture.code },
      {
        $set: {
          code: fixture.code,
          title: fixture.title,
          lecturerId: lecturer._id,
          enrolledStudents,
          alertThreshold: 75,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    coursesByCode.set(fixture.code, course);
  }

  const attendanceWrites = [];
  let activeSession = null;

  for (const fixture of sessionFixtures) {
    const course = coursesByCode.get(fixture.courseCode);
    const sessionDate = new Date(fixture.startedAt);
    const session = await Session.findOneAndUpdate(
      {
        courseId: course._id,
        lecturerId: course.lecturerId,
        venueId: venue._id,
        startedAt: sessionDate,
      },
      {
        $set: {
          courseId: course._id,
          lecturerId: course.lecturerId,
          venueId: venue._id,
          startedAt: sessionDate,
          isActive: Boolean(fixture.active),
          ...(fixture.active ? {} : { endedAt: new Date(sessionDate.getTime() + 60 * 60 * 1000) }),
        },
        ...(fixture.active ? { $unset: { endedAt: 1 } } : {}),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (fixture.active) activeSession = session;

    for (const email of fixture.present) {
      const student = usersByEmail.get(email);
      attendanceWrites.push({
        updateOne: {
          filter: { sessionId: session._id, studentId: student._id },
          update: {
            $set: {
              sessionId: session._id,
              studentId: student._id,
              checkedInAt: new Date(sessionDate.getTime() + 10 * 60 * 1000),
              lat: DEMO_VENUE.lat,
              lng: DEMO_VENUE.lng,
              distanceMetres: 0,
              status: 'present',
              rejectReason: null,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (attendanceWrites.length) {
    await AttendanceRecord.bulkWrite(attendanceWrites, { ordered: false });
  }

  await generateQRToken(activeSession._id.toString());

  console.log('Demo data seeded successfully.');
  console.log(`Profiles: ${profileFixtures.length} (1 admin, 2 lecturers, 5 students)`);
  console.log(`Courses: ${courseFixtures.length}; venue: ${venue.name}`);
  console.log(`Sessions: ${sessionFixtures.length} (1 active); attendance records: ${attendanceWrites.length}`);
  console.log(`Active session: ${activeSession._id} (CSC407); request a fresh QR token from the lecturer endpoint.`);
  console.log(`Demo geofence center: ${DEMO_VENUE.lat}, ${DEMO_VENUE.lng}; radius: ${DEMO_VENUE.radiusMetres}m`);
  console.log(`All seeded accounts use password: ${DEFAULT_PASSWORD}`);
  console.log(`Seed login emails: ${profileFixtures.map(({ email }) => email).join(', ')}`);
  console.log(`For duplicate check-in testing, student1 is already checked into the active session; use student2 for a fresh check-in.`);
};

seedDemoData()
  .catch((error) => {
    console.error('Demo seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
