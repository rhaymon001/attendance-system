import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Views
import LoginView from '@/views/auth/LoginView.vue'

// Layouts
import AdminLayout from '@/layouts/AdminLayout.vue'
import LecturerLayout from '@/layouts/LecturerLayout.vue'
import StudentLayout from '@/layouts/StudentLayout.vue'

// Admin Views
import AdminDashboardView from '@/views/admin/DashboardView.vue'
import AdminStudentsView from '@/views/admin/StudentsView.vue'
import AdminLecturersView from '@/views/admin/LecturersView.vue'
import AdminCoursesView from '@/views/admin/CoursesView.vue'
import AdminVenuesView from '@/views/admin/VenuesView.vue'

// Lecturer Views
import LecturerDashboardView from '@/views/lecturer/DashboardView.vue'
import LecturerSessionView from '@/views/lecturer/SessionView.vue'
import LecturerHistoryView from '@/views/lecturer/HistoryView.vue'
import LecturerReportView from '@/views/lecturer/ReportView.vue'

// Student Views
import StudentCoursesView from '@/views/student/CoursesView.vue'
import StudentCheckInView from '@/views/student/CheckInView.vue'
import StudentAttendanceView from '@/views/student/AttendanceView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },

  // ==================== ADMIN ROUTES ====================
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboardView
      },
      {
        path: 'students',
        name: 'admin-students',
        component: AdminStudentsView
      },
      {
        path: 'lecturers',
        name: 'admin-lecturers',
        component: AdminLecturersView
      },
      {
        path: 'courses',
        name: 'admin-courses',
        component: AdminCoursesView
      },
      {
        path: 'venues',
        name: 'admin-venues',
        component: AdminVenuesView
      }
    ]
  },

  // ==================== LECTURER ROUTES ====================
  {
    path: '/lecturer',
    component: LecturerLayout,
    meta: { requiresAuth: true, role: 'lecturer' },
    children: [
      {
        path: '',
        redirect: '/lecturer/dashboard'
      },
      {
        path: 'dashboard',
        name: 'lecturer-dashboard',
        component: LecturerDashboardView
      },
      {
        path: 'session/:courseId',
        name: 'lecturer-session',
        component: LecturerSessionView
      },
      {
        path: 'history/:courseId',
        name: 'lecturer-history',
        component: LecturerHistoryView
      },
      {
        path: 'report/:courseId',
        name: 'lecturer-report',
        component: LecturerReportView
      }
    ]
  },

  // ==================== STUDENT ROUTES ====================
  {
    path: '/student',
    component: StudentLayout,
    meta: { requiresAuth: true, role: 'student' },
    children: [
      {
        path: '',
        redirect: '/student/courses'
      },
      {
        path: 'courses',
        name: 'student-courses',
        component: StudentCoursesView
      },
      {
        path: 'checkin/:courseId?',
        name: 'student-checkin',
        component: StudentCheckInView
      },
      {
        path: 'attendance/:courseId?',
        name: 'student-attendance',
        component: StudentAttendanceView
      }
    ]
  },

  // Fallback 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Route Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const token = authStore.token
  const role = authStore.role

  if (to.meta.requiresAuth) {
    if (!token) {
      return next({ name: 'login' })
    }

    if (to.meta.role && to.meta.role !== role) {
      if (role === 'admin') return next({ name: 'admin-dashboard' })
      if (role === 'lecturer') return next({ name: 'lecturer-dashboard' })
      if (role === 'student') return next({ name: 'student-courses' })
      return next({ name: 'login' })
    }
  } else if (to.name === 'login' && token) {
    if (role === 'admin') return next({ name: 'admin-dashboard' })
    if (role === 'lecturer') return next({ name: 'lecturer-dashboard' })
    if (role === 'student') return next({ name: 'student-courses' })
  }

  next()
})

export default router
