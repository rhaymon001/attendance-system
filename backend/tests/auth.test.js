const request = require('supertest');
const bcrypt = require('bcryptjs');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./setup');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth & Protected Route Hardening Tests', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await connectTestDB();
  }, 10000);

  afterAll(async () => {
    if (dbAvailable) {
      await disconnectTestDB();
    }
  });

  beforeEach(async () => {
    if (dbAvailable) {
      await clearTestDB();
    }
  });

  test('should reject access to protected routes without a token (401)', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/no token provided/i);
  });

  test('should successfully log in with valid credentials and return JWT token', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const rawPassword = 'StrongPassword123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await User.create({
      name: 'Dr. John Doe',
      email: 'john.doe@university.edu',
      password: hashedPassword,
      role: 'lecturer',
      department: 'Computer Science',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@university.edu',
        password: rawPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.role).toBe('lecturer');
    expect(response.body.user.email).toBe('john.doe@university.edu');

    // Verify activeToken single session field is updated in database
    const userInDb = await User.findOne({ email: 'john.doe@university.edu' });
    expect(userInDb.activeToken).toBe(response.body.token);
  });

  test('should reject login with invalid password (401)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);

    await User.create({
      name: 'Alice Student',
      email: 'alice@student.university.edu',
      password: hashedPassword,
      role: 'student',
      matricNo: 'CSC/2022/001',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@student.university.edu',
        password: 'WrongPassword!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('should reject login with non-existent email (401)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@university.edu',
        password: 'Password123!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('should reject access when token does not match activeToken in database (401 session expired)', async () => {
    if (!dbAvailable) {
      console.warn('Skipping DB integration test: configure TEST_MONGO_URI to run');
      return;
    }

    const rawPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await User.create({
      name: 'Bob Student',
      email: 'bob@student.university.edu',
      password: hashedPassword,
      role: 'student',
      matricNo: 'CSC/2022/002',
    });

    // Login #1
    const loginRes1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@student.university.edu',
        password: rawPassword,
      });

    const token1 = loginRes1.body.token;

    // Login #2 (invalidates Login #1 token)
    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@student.university.edu',
        password: rawPassword,
      });

    const token2 = loginRes2.body.token;
    expect(token1).not.toBe(token2);

    // Using old token1 must return 401 Session expired
    const oldSessionRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token1}`);

    expect(oldSessionRes.status).toBe(401);
    expect(oldSessionRes.body.message).toBe('Session expired');

    // Using new token2 succeeds
    const newSessionRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token2}`);

    expect(newSessionRes.status).toBe(200);
    expect(newSessionRes.body.email).toBe('bob@student.university.edu');
  });
});
