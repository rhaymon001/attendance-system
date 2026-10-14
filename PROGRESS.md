# HABIBA Attendance System — Progress Tracker

> Blueprint: `HABIBA_SYSTEM_STRUCTURE(1).md` · Ground rules: `AGENTS.md`
> **Update this file at the end of every session** (add a dated entry under "Session Log").

Last updated: 2026-10-11

---

## 1. Status at a Glance

| Area | Spec'd files | Built | Missing | Status |
|------|-------------|-------|---------|--------|
| Backend (`backend/`) | ~34 | 0 | 34 | 🔴 Not started (empty folder) |
| Frontend core (router/api/store) | — | 4 | ~2 | 🟡 Partial |
| Frontend views | 13 | 13 | 0 | 🟢 Done |
| Frontend layouts | 3 | 3 | 0 | 🟢 Done |
| Frontend composables | 4 | 3 | 1 | 🟡 Partial |
| Frontend components | 13 | 7 | 6 | 🟡 Partial |
| PWA (manifest/icons/SW) | 3 | 0 | 3 | 🔴 Not started |
| Config / env / tooling | — | 2 | ~4 | 🟡 Partial |

**Bottom line:** the whole backend is missing; the frontend is a functioning-looking
UI shell with no API to talk to. The login flow is also broken (no post-login redirect).

---

## 2. Backend — Pending (entire folder is EMPTY)

`backend/` contains **no files at all**. Everything below is pending.

### Config
- [ ] `src/config/db.js` — Mongo connection
- [ ] `src/config/env.js` — required env var validation
- [ ] `src/config/socket.js` — Socket.io init + room logic + `getIO()`

### Models
- [ ] `src/models/User.js`
- [ ] `src/models/Course.js`
- [ ] `src/models/Venue.js`
- [ ] `src/models/Session.js`
- [ ] `src/models/QRToken.js` (TTL index, no `used` field)
- [ ] `src/models/AttendanceRecord.js` (unique `{sessionId, studentId}`)

### Middleware
- [ ] `src/middleware/protect.js` (JWT + `activeToken` match)
- [ ] `src/middleware/authorise.js` (role factory)
- [ ] `src/middleware/errorHandler.js`

### Utils
- [ ] `src/utils/generateToken.js` (HMAC-SHA256 QR)
- [ ] `src/utils/verifyToken.js`
- [ ] `src/utils/haversine.js`
- [ ] `src/utils/sendEmail.js` (Nodemailer)
- [ ] `src/utils/csvParser.js`

### Queues
- [ ] `src/queues/alertQueue.js` (Bull + Redis)
- [ ] `src/queues/alertWorker.js`

### Controllers
- [ ] `src/controllers/auth.controller.js` (login/logout/getMe)
- [ ] `src/controllers/admin.controller.js`
- [ ] `src/controllers/session.controller.js`
- [ ] `src/controllers/attendance.controller.js` ← core algorithm
- [ ] `src/controllers/report.controller.js` (stats/CSV/PDF)

### Routes
- [ ] `src/routes/auth.routes.js`
- [ ] `src/routes/admin.routes.js`
- [ ] `src/routes/session.routes.js`
- [ ] `src/routes/attendance.routes.js`
- [ ] `src/routes/report.routes.js`

### Entry / Project files
- [ ] `src/app.js`
- [ ] `server.js`
- [ ] `package.json`
- [ ] `.gitignore`
- [ ] `.env` / `.env.example`

---

## 3. Frontend — Finished

### Core
- [x] `src/main.js`
- [x] `src/App.vue`
- [x] `src/router/index.js` (all design routes wired: admin dashboard/students/lecturers/courses/venues; lecturer dashboard/session/history/report; student courses/checkin/attendance; role guards)
- [x] `src/api/axios.js` (JWT interceptor + 401 redirect)
- [x] `src/stores/auth.store.js`

### Layouts
- [x] `src/layouts/AdminLayout.vue`
- [x] `src/layouts/LecturerLayout.vue`
- [x] `src/layouts/StudentLayout.vue`

### Views
- [x] `src/views/auth/LoginView.vue` *(UI done, redirect missing — see issues)*
- [x] `src/views/admin/DashboardView.vue`
- [x] `src/views/admin/StudentsView.vue`
- [x] `src/views/admin/LecturersView.vue`
- [x] `src/views/admin/CoursesView.vue`
- [x] `src/views/admin/VenuesView.vue`
- [x] `src/views/lecturer/DashboardView.vue`
- [x] `src/views/lecturer/SessionView.vue`
- [x] `src/views/lecturer/HistoryView.vue`
- [x] `src/views/lecturer/ReportView.vue`
- [x] `src/views/student/CoursesView.vue`
- [x] `src/views/student/CheckInView.vue`
- [x] `src/views/student/AttendanceView.vue`

### Composables
- [x] `src/composables/useSocket.js`
- [x] `src/composables/useGeolocation.js`
- [x] `src/composables/useQRGenerator.js`

### Components
- [x] `src/components/qr/QRScanner.vue` (jsQR + torch + flip — includes useQRScanner logic inline)
- [x] `src/components/attendance/CheckInResult.vue`
- [x] `src/components/ui/AppModal.vue`
- [x] `src/components/ui/AppTable.vue`
- [x] `src/components/ui/AppToast.vue`
- [x] `src/components/ui/AppBadge.vue`
- [x] `src/components/ui/AppSpinner.vue`

### Styling / tooling
- [x] `src/assets/main.css` (Tailwind v4 `@theme`, Inter font)
- [x] `vite.config.js` (`@tailwindcss/vite`, `@` alias)
- [x] `package.json`, `index.html`, `jsconfig.json`

---

## 4. Frontend — Pending

### Views (routed in spec, not built & not routed)
- All spec views are now built and routed. ✅

### Stores
- [ ] `src/stores/session.store.js`
- [ ] `src/stores/alert.store.js`

### Composables
- [ ] `src/composables/useQRScanner.js` (logic currently inlined in `QRScanner.vue`)

### Components
- [ ] `src/components/ui/AppButton.vue`
- [ ] `src/components/ui/AppCard.vue`
- [ ] `src/components/qr/QRDisplay.vue` (currently inlined in SessionView)
- [ ] `src/components/attendance/AttendanceTable.vue` (currently inlined in SessionView)
- [ ] `src/components/admin/CSVImportModal.vue` (currently inlined in StudentsView)

### PWA
- [ ] `vite-plugin-pwa` config in `vite.config.js` (dep installed, **not configured**)
- [ ] `public/manifest.webmanifest`
- [ ] PWA icons (192x192, 512x512)

### Config / env
- [ ] `frontend/.env` + `.env.example` (`VITE_API_URL`)
- [ ] Material Symbols font link (see issues)
- [ ] Vite dev proxy (optional, for local API)

---

## 5. Known Issues

### 🔴 Blocking
1. **Backend entirely missing.** Every `api.*` call in the frontend 404s. Nothing runs end-to-end.
2. **Login never redirects.** `LoginView.handleSubmit` emits `submit` but no one handles it and it never routes by role. User stays on `/login` after a successful login. (`LoginView.vue:234`)
3. **Material Symbols font not loaded.** UI uses `material-symbols-outlined` everywhere, but no font `<link>` exists in `index.html` or CSS → all icons render as text.
4. **`.env` is not gitignored.** A root `.env` exists but there is **no root `.gitignore`** (only `frontend/.gitignore`, which ignores `*.local` but not `.env`). Add `.env` to a root `.gitignore` before committing. *(No secret contents were read.)*

### 🟠 Functional gaps / mismatches
5. **Frontend calls endpoints the spec never defined** (backend must add them or frontend must change):
   - `GET /api/admin/students`, `POST /api/admin/students`, `PUT /api/admin/students/:id`, `DELETE /api/admin/students/:id`
   - `GET /api/admin/venues`, `DELETE /api/admin/venues/:id`
   - `GET /api/sessions` (list all, for admin dashboard)
   - `GET /api/lecturer/courses` / `GET /api/courses`
   - `GET /api/student/courses`
   - Spec only lists `import/create` endpoints for admin and no `/courses` listing routes.
6. ~~**Route/view mismatch:** spec defines `/lecturer/history/:courseId`, `/lecturer/report/:courseId`, `/admin/lecturers`, `/admin/courses` — not in `router/index.js`~~ **FIXED 2026-10-11**: all four views built and routed; admin sidebar + lecturer dashboard now link to them.
6b. **New views assume backend endpoints not in the spec:** `GET/DELETE /api/admin/lecturers`, `PUT /api/admin/lecturers/:id`, `GET /api/admin/courses`, `DELETE /api/admin/courses/:id`, `GET /api/admin/courses/:id/students`, `PUT /api/admin/courses/:id/remove`, `GET /api/admin/students`. Backend must implement these or views must be adjusted.
7. **`SessionView` creates a new session on every mount** (`POST /api/sessions`). Revisiting the page spawns duplicate active sessions; no guard to reuse an existing active session for the course.
8. **Socket URL fallback to `''`** in `useSocket.js`/`axios.js` with no Vite dev proxy → in local dev, WS/REST hit the Vite origin, not the backend.
9. **`CheckInView` falls back to hard-coded sample values** (`'CSC407'`, distance `12`, `340`, `'ETF Hall 2'`) when the API omits fields — will display fake data if backend responses are incomplete.
10. **No route for `/student/checkin` without a courseId** — route allows optional param, but course title/venue come only from query string; deep-linking yields placeholder content.

### 🟡 Cleanup / code quality
11. **Scaffold leftovers** to delete: `src/stores/counter.js`, `src/components/icons/Icon*.vue` (5 files), `src/assets/logo.svg`, `src/assets/base.css` (unused, not imported).
12. **Unused imports** in `useQRGenerator.js` (`watch`, `onMounted`).
13. **`index.html`** still has `<title>Vite App</title>`, no PWA meta tags / theme-color / viewport-fit=cover.
14. Spec's `tailwind.config.js` / `postcss.config.js` intentionally absent — project uses **Tailwind v4** via `@tailwindcss/vite` and `@theme` in CSS. This is a valid deviation; keep the spec doc in mind if upgrading/downgrading.
15. Frontend dependency versions are **newer than spec** (Vue Router `^5`, Pinia `^4`, Vite `^8`, Tailwind `^4`). Verify APIs still match before relying on spec snippets verbatim.

---

## 6. Suggested Next Steps (priority order)

1. Add root `.gitignore` (ignore `.env`, `node_modules`, `dist`). *(issue #4)*
2. Add Material Symbols font + real `<title>`/PWA meta to `index.html`. *(issue #3, #13)*
3. Fix login redirect by role in `LoginView.vue`. *(issue #2)*
4. Scaffold backend `package.json` + `server.js` + `app.js`, then models → utils → middleware → controllers → routes per spec order.
5. Align the frontend/backend API surface (issue #5) — decide the authoritative route list.
6. Configure `vite-plugin-pwa` + manifest + icons.
7. Build remaining views/components and wire routes.
8. Remove scaffold leftovers (#11) and do a lint/build pass.

---

## 7. Session Log

### 2026-10-11 — Initial audit
- Read `AGENTS.md`, `HABIBA_SYSTEM_STRUCTURE(1).md`; scanned full repo tree.
- Confirmed `backend/` is empty; catalogued frontend files.
- Created this `PROGRESS.md`.
- Open blockers identified: empty backend, broken login redirect, missing icon font, `.env` not gitignored.

### 2026-10-11 — Router + missing views
- Built 4 spec views: `admin/LecturersView.vue`, `admin/CoursesView.vue`, `lecturer/HistoryView.vue`, `lecturer/ReportView.vue`.
- Added supporting UI components `AppBadge.vue` and `AppSpinner.vue`.
- Rewired `router/index.js`: added `/admin/lecturers`, `/admin/courses`, `/lecturer/history/:courseId`, `/lecturer/report/:courseId`; made student attendance `attendance/:courseId?`.
- Added admin sidebar links (Lecturers, Courses) and lecturer dashboard links (History, Report).
- `npm run build` passes (166 modules, no errors).
- New views assume several backend endpoints beyond the original spec (logged as issue #6b).
