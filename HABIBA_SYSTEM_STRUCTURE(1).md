# HABIBA ATTENDANCE SYSTEM — COMPLETE STRUCTURE & SYSTEM DESIGN
## Optimised for Google Stitch / AI-assisted implementation

---

## MONOREPO LAYOUT

```
attendance-system/
├── backend/          ← Node.js / Express / MongoDB
├── frontend/         ← Vue 3 / Tailwind / Pinia PWA
└── README.md
```

---

## ═══════════════════════════════════════
## BACKEND — Full Structure
## ═══════════════════════════════════════

```
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js               ← MongoDB Atlas connection (mongoose.connect)
│   │   ├── env.js              ← Validates all required env vars on startup
│   │   └── socket.js           ← Socket.io server initialisation + room logic
│   │
│   ├── models/
│   │   ├── User.js             ← Student | Lecturer | Admin schema
│   │   ├── Course.js           ← Course with enrolledStudents array
│   │   ├── Venue.js            ← lat, lng, radiusMetres (default 50)
│   │   ├── Session.js          ← courseId, venueId, isActive, startedAt
│   │   ├── QRToken.js          ← token string, expiresAt, used: Boolean
│   │   └── AttendanceRecord.js ← studentId, sessionId, lat, lng, status
│   │
│   ├── middleware/
│   │   ├── protect.js          ← JWT verify + activeToken match check
│   │   ├── authorise.js        ← Role guard factory: authorise('admin')
│   │   └── errorHandler.js     ← Global Express error handler
│   │
│   ├── utils/
│   │   ├── generateToken.js    ← HMAC-SHA256 QR token generation
│   │   ├── verifyToken.js      ← HMAC-SHA256 QR token verification
│   │   ├── haversine.js        ← Haversine distance calculation
│   │   ├── sendEmail.js        ← Nodemailer SMTP wrapper
│   │   └── csvParser.js        ← csv-parse wrapper for bulk student import
│   │
│   ├── queues/
│   │   ├── alertQueue.js       ← Bull queue definition (Redis connection)
│   │   └── alertWorker.js      ← Bull worker: processes absenteeism jobs → sendEmail
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       ← login, logout, getMe
│   │   ├── admin.controller.js      ← importStudents, createLecturer,
│   │   │                               createCourse, createVenue,
│   │   │                               getDashboardStats
│   │   ├── session.controller.js    ← createSession, endSession,
│   │   │                               generateQR, getSessionAttendance
│   │   ├── attendance.controller.js ← checkIn (core algorithm lives here)
│   │   └── report.controller.js     ← getCourseStats, exportCSV, exportPDF
│   │
│   ├── routes/
│   │   ├── auth.routes.js           ← /api/auth/*
│   │   ├── admin.routes.js          ← /api/admin/*
│   │   ├── session.routes.js        ← /api/sessions/*
│   │   ├── attendance.routes.js     ← /api/attendance/*
│   │   └── report.routes.js         ← /api/reports/*
│   │
│   └── app.js                  ← Express app setup: cors, helmet, json,
│                                  routes mount, error handler mount
│
├── server.js                   ← Entry point: HTTP server + Socket.io attach
│                                  + DB connect + queue worker start
│
├── .env                        ← See env vars section below
├── .env.example
├── .gitignore
└── package.json
```

---

## BACKEND — Every File's Responsibility

### `server.js`
```
- Creates http.createServer(app)
- Attaches Socket.io to the HTTP server
- Calls config/db.js to connect MongoDB
- Starts alertWorker.js
- Listens on PORT
```

### `src/config/db.js`
```
- mongoose.connect(process.env.MONGO_URI)
- Logs connected / error
```

### `src/config/socket.js`
```
- Exports initSocket(httpServer) function
- Stores io instance for use in controllers
- Exports getIO() to access io from attendance controller
- On connection: socket joins room named after sessionId
  (client sends { sessionId } in handshake auth)
```

### `src/config/env.js`
```
- Checks these exist at startup: MONGO_URI, JWT_SECRET,
  HMAC_SECRET, REDIS_URL, SMTP_HOST, SMTP_PORT,
  SMTP_USER, SMTP_PASS, CLIENT_URL
- Throws if any missing
```

---

## BACKEND — Models (exact schemas)

### `User.js`
```js
{
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },       // bcrypt hashed
  role:        { type: String, enum: ['student','lecturer','admin'], required: true },
  matricNo:    { type: String },                       // students only
  department:  { type: String },
  level:       { type: String },                       // students only: 100–600
  activeToken: { type: String, default: null },        // single-session enforcement
  timestamps:  true
}
```

### `Course.js`
```js
{
  title:            { type: String, required: true },
  code:             { type: String, required: true, unique: true },
  lecturerId:       { type: ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: ObjectId, ref: 'User' }],
  alertThreshold:   { type: Number, default: 75 },     // % below which alert fires
  timestamps:       true
}
```

### `Venue.js`
```js
{
  name:         { type: String, required: true },
  building:     { type: String },
  lat:          { type: Number, required: true },
  lng:          { type: Number, required: true },
  radiusMetres: { type: Number, default: 50 },
  timestamps:   true
}
```

### `Session.js`
```js
{
  courseId:   { type: ObjectId, ref: 'Course', required: true },
  lecturerId: { type: ObjectId, ref: 'User',   required: true },
  venueId:    { type: ObjectId, ref: 'Venue',  required: true },
  startedAt:  { type: Date, default: Date.now },
  endedAt:    { type: Date },
  isActive:   { type: Boolean, default: true },
  timestamps: true
}
```

### `QRToken.js`
```js
{
  sessionId:  { type: ObjectId, ref: 'Session', required: true },
  token:      { type: String, required: true, unique: true },
  createdAt:  { type: Date, default: Date.now },
  expiresAt:  { type: Date, required: true },          // createdAt + 2 min
  timestamps: false                                    // keep lean
}
// Index: { expiresAt: 1 } with expireAfterSeconds: 0 → auto-delete expired tokens
// NOTE: no 'used' field. Token stays valid for its full 2-minute window
// so the whole class can scan the same displayed code. Student-level
// deduplication is handled by the unique index on AttendanceRecords.
```

### `AttendanceRecord.js`
```js
{
  sessionId:      { type: ObjectId, ref: 'Session', required: true },
  studentId:      { type: ObjectId, ref: 'User',    required: true },
  checkedInAt:    { type: Date, default: Date.now },
  lat:            { type: Number, required: true },
  lng:            { type: Number, required: true },
  distanceMetres: { type: Number, required: true },
  status:         { type: String, enum: ['present','rejected'], required: true },
  rejectReason:   { type: String },                    // null if present
  timestamps:     false
}
// Compound index: { sessionId: 1, studentId: 1 } unique → prevents duplicate
```

---

## BACKEND — Middleware

### `protect.js`
```
1. Extract Bearer token from Authorization header
2. jwt.verify(token, JWT_SECRET) → decode { id, role }
3. User.findById(id).select('+activeToken')
4. If user.activeToken !== token → 401 'Session expired'
5. req.user = user; next()
```

### `authorise.js`
```
Factory: authorise('admin') → middleware
Checks req.user.role === passed role(s)
→ 403 'Forbidden' if mismatch
```

---

## BACKEND — Utils (exact logic)

### `generateToken.js`
```js
const crypto = require('crypto');
// sessionId: string (MongoDB ObjectId as string)
// Returns: "sessionId:timestamp:hmacSig" string
// Also saves QRToken doc to DB — caller awaits this
```

### `verifyToken.js`
```js
// Splits token into [sessionId, ts, sig]
// Recomputes HMAC — mismatch → { valid: false, reason: 'tampered' }
// Checks Date.now() - ts > 120000 → { valid: false, reason: 'expired' }
// Checks DB: QRToken.findOne({ token }) exists and belongs to an active session
//   → not found → { valid: false, reason: 'invalid' }
// Returns { valid: true, sessionId, qrTokenDoc }
//
// NOTE: no 'used' flag check here. The token remains valid for its full
// 2-minute window so multiple students can scan the same displayed code.
// Duplicate check-ins per student are prevented by the unique compound
// index { sessionId, studentId } on AttendanceRecords.
```

### `haversine.js`
```js
// haversineDistance(lat1, lng1, lat2, lng2) → metres (Number)
// Uses R = 6371000 (Earth radius metres)
```

### `sendEmail.js`
```js
// sendEmail({ to, subject, html })
// Uses nodemailer transporter from SMTP_* env vars
```

### `csvParser.js`
```js
// parseCSV(buffer) → Promise<Array<{name,email,matricNo,department,level}>>
// Uses csv-parse with header row
```

---

## BACKEND — Controllers (method signatures)

### `auth.controller.js`
```
login(req, res)
  - Find user by email → bcrypt.compare password
  - jwt.sign → save as activeToken → return token + role

logout(req, res)
  - Set user.activeToken = null → save → 200

getMe(req, res)
  - Return req.user (set by protect middleware)
```

### `admin.controller.js`
```
importStudents(req, res)
  - Receive CSV file (multipart) → parseCSV
  - For each row: bcrypt.hash default password → User.create
  - Return { created: N, skipped: M }

createLecturer(req, res)     ← CRUD
createCourse(req, res)       ← CRUD
updateCourse(req, res)       ← enrol/remove students
createVenue(req, res)        ← CRUD
getDashboardStats(req, res)  ← counts: users, sessions, records
```

### `session.controller.js`
```
createSession(req, res)
  - Create Session doc (isActive: true)
  - Call generateToken(sessionId) → return session + first QR token

generateQR(req, res)
  - GET /api/sessions/:id/qr
  - Verify session isActive + lecturerId === req.user._id
  - Call generateToken → return new token string

getSessionAttendance(req, res)
  - GET /api/sessions/:id/attendance
  - AttendanceRecord.find({ sessionId }).populate('studentId','name matricNo')

endSession(req, res)
  - Session.findByIdAndUpdate({ isActive: false, endedAt: Date.now() })
```

### `attendance.controller.js`  ← THE CORE
```
checkIn(req, res)
  1. Destructure { token, lat, lng } from req.body

  2. verifyToken(token)
     → checks HMAC signature, expiry (2 min), and that token exists in DB
     → if !valid → 400 with reason ('tampered' | 'expired')
     → NOTE: do NOT mark used here — token stays valid for its full 2-min
       window so the whole class can scan the same code. The unique
       compound index { sessionId, studentId } on AttendanceRecords is
       what prevents a student checking in twice, not token invalidation.

  3. Check for duplicate FIRST (before geofence):
     AttendanceRecord.findOne({ sessionId, studentId, status: 'present' })
     → if exists → return 409 'Already checked in this session'
     ↑ BUG FIX: duplicate check must come before geofence check, otherwise
       a student who already checked in gets a spurious 'rejected' record
       if their GPS drifts out of range on a second attempt.

  4. Session.findById(sessionId).populate('venueId')

  5. haversineDistance(lat, lng, venue.lat, venue.lng)
     → if distance > venue.radiusMetres
        → return 400 { message: 'Not at venue', distanceMetres }
        → do NOT save a rejected AttendanceRecord — just reject silently.
          Recording rejections pollutes the attendance data with noise from
          GPS drift. Only save records for successful check-ins.

  6. AttendanceRecord.create({ status: 'present', distanceMetres })
     → the unique index { sessionId, studentId } acts as a hard DB-level
       guard against any race-condition duplicates

  7. getIO().to(sessionId.toString()).emit('attendance:new', {
       studentId, name, matricNo, checkedInAt
     })

  8. Calculate cumulative attendance % for this student in this course
     → if below course.alertThreshold → alertQueue.add(job)

  9. Return 200 { message: 'Present', distanceMetres }
```

### `report.controller.js`
```
getCourseStats(req, res)
  - Aggregate AttendanceRecords grouped by studentId for courseId
  - Return array: [{ student, totalSessions, attended, percentage }]

exportCSV(req, res)
  - Same aggregation → json2csv → res.attachment('report.csv')

exportPDF(req, res)
  - Same aggregation → PDFKit table → res.attachment('report.pdf')
```

---

## BACKEND — Routes

### `auth.routes.js`
```
POST   /api/auth/login      → auth.login
POST   /api/auth/logout     → protect → auth.logout
GET    /api/auth/me         → protect → auth.getMe
```

### `admin.routes.js`
```
All routes: protect → authorise('admin')
POST   /api/admin/students/import  → admin.importStudents  (multipart)
POST   /api/admin/lecturers        → admin.createLecturer
POST   /api/admin/courses          → admin.createCourse
PUT    /api/admin/courses/:id      → admin.updateCourse
POST   /api/admin/venues           → admin.createVenue
GET    /api/admin/stats            → admin.getDashboardStats
```

### `session.routes.js`
```
protect on all
POST   /api/sessions             → authorise('lecturer') → session.createSession
GET    /api/sessions/:id/qr      → authorise('lecturer') → session.generateQR
GET    /api/sessions/:id/attendance → authorise('lecturer') → session.getSessionAttendance
PATCH  /api/sessions/:id/end     → authorise('lecturer') → session.endSession
```

### `attendance.routes.js`
```
POST   /api/attendance/checkin   → protect → authorise('student') → attendance.checkIn
```

### `report.routes.js`
```
protect → authorise('lecturer') on all
GET    /api/reports/:courseId              → report.getCourseStats
GET    /api/reports/:courseId/export/csv   → report.exportCSV
GET    /api/reports/:courseId/export/pdf   → report.exportPDF
```

---

## BACKEND — Queue

### `alertQueue.js`
```js
// Bull queue named 'absenteeism-alerts'
// Connected to REDIS_URL
// Job data: { studentEmail, studentName, courseName, percentage, lecturerEmail }
```

### `alertWorker.js`
```js
// queue.process(async (job) => {
//   sendEmail({ to: job.data.lecturerEmail, ... })
// })
```

---

## BACKEND — Environment Variables
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=long_random_string
HMAC_SECRET=another_long_random_string
REDIS_URL=redis://...                    ← Railway Redis plugin URL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=gmail_app_password
CLIENT_URL=https://your-frontend.vercel.app
```

---

## BACKEND — package.json dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "socket.io": "^4.6.0",
    "bull": "^4.12.0",
    "nodemailer": "^6.9.0",
    "pdfkit": "^0.14.0",
    "json2csv": "^6.0.0-alpha.2",
    "csv-parse": "^5.5.0",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.0",
    "express-async-errors": "^3.1.1"
  }
}
```

---

## ═══════════════════════════════════════
## FRONTEND — Full Structure
## ═══════════════════════════════════════

```
frontend/
│
├── public/
│   ├── icons/                  ← PWA icons (192x192, 512x512 png)
│   └── manifest.webmanifest    ← PWA manifest (auto-generated by vite-plugin-pwa)
│
├── src/
│   │
│   ├── api/
│   │   └── axios.js            ← Axios instance: baseURL, JWT interceptor,
│   │                              401 → redirect to login
│   │
│   ├── stores/                 ← Pinia stores
│   │   ├── auth.store.js       ← token, user, role; login/logout actions
│   │   ├── session.store.js    ← active session, QR token, attendees list
│   │   └── alert.store.js      ← toast/notification state
│   │
│   ├── composables/
│   │   ├── useSocket.js        ← Socket.io connection; joins sessionId room;
│   │   │                          exposes onAttendanceNew(cb) listener
│   │   ├── useQRScanner.js     ← jsQR camera loop; exposes scan(),
│   │   │                          stopCamera(); emits decoded string
│   │   ├── useGeolocation.js   ← navigator.geolocation wrapper;
│   │   │                          returns { lat, lng } promise
│   │   └── useQRGenerator.js   ← qrcode npm → renders token string
│   │                              to <canvas>; auto-refreshes on
│   │                              token prop change
│   │
│   ├── router/
│   │   └── index.js            ← Vue Router 4; route guards below
│   │
│   ├── layouts/
│   │   ├── AdminLayout.vue     ← Sidebar nav (Admin links) + <RouterView>
│   │   ├── LecturerLayout.vue  ← Sidebar nav (Lecturer links) + <RouterView>
│   │   └── StudentLayout.vue   ← Bottom nav bar + <RouterView>
│   │
│   ├── views/
│   │   ├── auth/
│   │   │   └── LoginView.vue   ← Single login form for all roles;
│   │   │                          redirects by role after login
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardView.vue    ← Stats cards: users, sessions, records
│   │   │   ├── StudentsView.vue     ← Table + CSV import button + modal
│   │   │   ├── LecturersView.vue    ← Table + create lecturer form
│   │   │   ├── CoursesView.vue      ← Table + create course + enrol students
│   │   │   └── VenuesView.vue       ← Table + create venue (lat/lng input)
│   │   │
│   │   ├── lecturer/
│   │   │   ├── DashboardView.vue    ← My courses list
│   │   │   ├── SessionView.vue      ← Start session → QR display + live list
│   │   │   ├── HistoryView.vue      ← Past sessions for a course
│   │   │   └── ReportView.vue       ← Attendance % table + CSV/PDF buttons
│   │   │
│   │   └── student/
│   │       ├── CoursesView.vue      ← My enrolled courses
│   │       ├── CheckInView.vue      ← Camera QR scanner + result card
│   │       └── AttendanceView.vue   ← My attendance history per course
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AppButton.vue        ← variant: primary|secondary|danger
│   │   │   ├── AppCard.vue          ← white card with shadow
│   │   │   ├── AppBadge.vue         ← present(green)|rejected(red)|pending
│   │   │   ├── AppModal.vue         ← slot-based modal with backdrop
│   │   │   ├── AppSpinner.vue       ← loading spinner
│   │   │   ├── AppToast.vue         ← success/error toast notification
│   │   │   └── AppTable.vue         ← generic sortable table
│   │   │
│   │   ├── qr/
│   │   │   ├── QRDisplay.vue        ← canvas QR + countdown timer (2:00→0:00)
│   │   │   │                           emits 'refresh' when timer hits zero
│   │   │   └── QRScanner.vue        ← video element + jsQR decode loop
│   │   │                               emits 'decoded' with token string
│   │   │
│   │   ├── attendance/
│   │   │   ├── AttendanceTable.vue  ← name|matricNo|time|distance columns
│   │   │   └── CheckInResult.vue    ← result card: present|expired|tampered|
│   │   │                               out_of_range|already_checked_in
│   │   │
│   │   └── admin/
│   │       └── CSVImportModal.vue   ← file input + preview + submit
│   │
│   ├── assets/
│   │   └── main.css                ← Tailwind directives only
│   │
│   └── main.js                     ← createApp → use(pinia) → use(router) → mount
│
├── index.html
├── vite.config.js                  ← @vitejs/plugin-vue + vite-plugin-pwa config
├── tailwind.config.js              ← Custom colours + font
├── postcss.config.js
├── .env                            ← VITE_API_URL=https://your-backend.railway.app
└── package.json
```

---

## FRONTEND — Key File Details

### `src/router/index.js` — Route structure + guards
```
/login                          → LoginView        (public)

/admin                          → AdminLayout
  /admin/dashboard              → admin/DashboardView
  /admin/students               → admin/StudentsView
  /admin/lecturers              → admin/LecturersView
  /admin/courses                → admin/CoursesView
  /admin/venues                 → admin/VenuesView

/lecturer                       → LecturerLayout
  /lecturer/dashboard           → lecturer/DashboardView
  /lecturer/session/:courseId   → lecturer/SessionView
  /lecturer/history/:courseId   → lecturer/HistoryView
  /lecturer/report/:courseId    → lecturer/ReportView

/student                        → StudentLayout
  /student/courses              → student/CoursesView
  /student/checkin/:courseId    → student/CheckInView
  /student/attendance/:courseId → student/AttendanceView

Route guard logic:
  - beforeEach: if no token → redirect to /login
  - if role === 'admin' and route starts with /lecturer → redirect /admin/dashboard
  - if role === 'student' and route starts with /admin → redirect /student/courses
  (etc. — each role locked to its own prefix)
```

### `src/api/axios.js`
```js
// baseURL: import.meta.env.VITE_API_URL
// Request interceptor: add Authorization: Bearer <token from auth.store>
// Response interceptor: if 401 → authStore.logout() → router.push('/login')
```

### `src/composables/useQRScanner.js`
```
- Accesses device camera via navigator.mediaDevices.getUserMedia
- Draws video frames to hidden <canvas> every 100ms
- Passes ImageData to jsQR()
- When jsQR returns a result → emits decoded string → stops camera
- Exposes: { videoRef, canvasRef, startScan(), stopScan(), error }
```

### `src/composables/useSocket.js`
```
- Connects to VITE_API_URL with { auth: { token } }
- socket.emit('join', { sessionId }) after connect
- onAttendanceNew(callback) → socket.on('attendance:new', callback)
- disconnect() on composable cleanup (onUnmounted)
```

### `src/views/lecturer/SessionView.vue` — Most complex view
```
State:
  - session (from API), qrToken (string), attendees (array)
  - isLoadingQR (bool)

On mount:
  - POST /api/sessions → get session + first QR token
  - useSocket().join(session._id)
  - useSocket().onAttendanceNew → push to attendees array

QRDisplay component:
  - Receives :token="qrToken"
  - On @refresh → call GET /api/sessions/:id/qr → update qrToken
  - QRDisplay re-renders QR canvas from new token

Live list:
  - AttendanceTable receives :records="attendees"
  - Updates reactively as Socket.io events arrive
```

### `src/views/student/CheckInView.vue` — Most critical student view
```
State:
  - scanning (bool), result (null | 'present' | 'expired' |
    'out_of_range' | 'already_checked_in' | 'tampered' | 'error')

Flow:
  1. Mount → QRScanner component starts camera
  2. QRScanner emits 'decoded' with token string
  3. Call useGeolocation() → get { lat, lng }
  4. POST /api/attendance/checkin with { token, lat, lng }
  5. Set result from response
  6. Show CheckInResult card with appropriate colour + message

Error handling:
  - GPS denied → show 'Location required' message
  - Camera denied → show 'Camera required' message
  - Network error → show 'Check your connection' message
```

---

## FRONTEND — package.json dependencies
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.6.0",
    "jsqr": "^1.4.0",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## FRONTEND — tailwind.config.js
```js
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#2563EB', dark: '#1D4ED8' },
        present:  '#16A34A',   // green-600
        rejected: '#DC2626',   // red-600
        pending:  '#D97706',   // amber-600
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    }
  }
}
```

---

## ═══════════════════════════════════════
## SYSTEM DESIGN SUMMARY
## (for Google Stitch prompt context)
## ═══════════════════════════════════════

### Architecture
```
[Vue 3 PWA] ──HTTPS──► [Express REST API] ──► [MongoDB Atlas]
     │                        │
     └──Socket.io (WS)────────┘
                              │
                         [Bull Queue]
                              │
                         [Redis (Railway)]
                              │
                         [Nodemailer SMTP]
```

### Data flow — check-in (critical path)
```
Student scans QR (jsQR)
  → GPS captured (HTML5 Geolocation API)
  → POST /api/attendance/checkin { token, lat, lng }
  → protect middleware (JWT + activeToken check)
  → verifyToken (HMAC sig + expiry check only — token stays valid for 2-min window)
  → duplicate check: AttendanceRecord exists for {sessionId, studentId}? → 409
  → haversineDistance(student GPS, venue GPS)
  → distance > 50m? → 400 (no record saved)
  → AttendanceRecord.create(present) — unique index guards race conditions
  → emit Socket.io 'attendance:new' to lecturer room
  → check attendance % → queue alert if below threshold
  → return 200 to student
```

### Three separate apps in one repo
```
Admin app    → manages the entire system (users, courses, venues)
Lecturer app → runs sessions, displays QR, watches live attendance
Student app  → logs in, scans QR, sees own attendance history
All three served from same Vue build — role determines which
layout and routes are accessible after login
```

---

## ═══════════════════════════════════════
## GOOGLE STITCH PROMPT STRATEGY
## ═══════════════════════════════════════

### How to use this document with Stitch:

1. **Paste the entire SYSTEM DESIGN SUMMARY section** as context first
2. **Generate one file at a time** — never ask for the whole backend at once
3. **Recommended generation order:**

```
BACKEND (do first):
  1. User.js model
  2. Course.js, Venue.js, Session.js, QRToken.js, AttendanceRecord.js models
  3. config/db.js + config/env.js
  4. utils/generateToken.js + utils/verifyToken.js (HMAC algorithms)
  5. utils/haversine.js
  6. middleware/protect.js + middleware/authorise.js
  7. controllers/auth.controller.js + routes/auth.routes.js
  8. controllers/admin.controller.js + routes/admin.routes.js
  9. controllers/session.controller.js + routes/session.routes.js
  10. controllers/attendance.controller.js ← hardest, most important
  11. controllers/report.controller.js + routes/report.routes.js
  12. config/socket.js
  13. queues/alertQueue.js + queues/alertWorker.js
  14. app.js + server.js

FRONTEND (do after backend is testable in Postman):
  1. tailwind.config.js + vite.config.js
  2. src/api/axios.js + stores/auth.store.js
  3. router/index.js (with guards)
  4. ui/ components (Button, Card, Badge, Modal, Spinner, Toast, Table)
  5. composables/useQRScanner.js ← hardest frontend piece
  6. composables/useGeolocation.js + useSocket.js + useQRGenerator.js
  7. LoginView.vue
  8. qr/QRDisplay.vue + qr/QRScanner.vue
  9. All admin views (DashboardView → VenuesView)
  10. lecturer/SessionView.vue ← hardest lecturer view
  11. lecturer/ReportView.vue (CSV/PDF download buttons)
  12. student/CheckInView.vue ← hardest student view
  13. student/AttendanceView.vue
  14. PWA manifest + service worker config
```

### Stitch prompt template per file:
```
Context: This is a student attendance system for a Nigerian university.
Stack: Node.js, Express, Mongoose, MongoDB, JWT, Socket.io, Bull, bcryptjs.
File to generate: [FILENAME]
Responsibility: [PASTE THE RESPONSIBILITY DESCRIPTION FROM THIS DOCUMENT]
Schema reference: [PASTE THE RELEVANT SCHEMA IF NEEDED]
Do not add features not listed. Follow this structure exactly.
```

---

*This document is the complete implementation blueprint.
All decisions are final and locked to the project specification.*
